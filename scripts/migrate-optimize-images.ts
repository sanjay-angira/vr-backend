/**
 * Backfill optimized image entity rows / flat columns for existing media.
 *
 * Usage (from vr-backend):
 *   npx ts-node -r tsconfig-paths/register scripts/migrate-optimize-images.ts
 *
 * Optional:
 *   MIGRATE_IMAGE_LIMIT=50
 *   MIGRATE_IMAGE_DRY_RUN=1
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductImage } from '../src/entities/product/product-images.entity';
import { VariantImage } from '../src/entities/product/variant-image.entity';
import { Category } from '../src/entities/productCategory/category.entity';
import { BlogPost } from '../src/entities/blog/blog-posts.entity';
import { Banner } from '../src/entities/CMS/banner.entity';
import { S3Service } from '../src/upload/s3.service';
import { ImageOptimizationService } from '../src/upload/image-optimization.service';
import type { ImageOptimizationType } from '../src/upload/image-optimization.types';
import type { OptimizedImageAsset } from '../src/upload/image-optimization.types';

const DRY_RUN = process.env.MIGRATE_IMAGE_DRY_RUN === '1';
const LIMIT = Number(process.env.MIGRATE_IMAGE_LIMIT || 0) || undefined;

function guessMime(url: string, contentType?: string): string {
  if (contentType?.startsWith('image/')) return contentType;
  const lower = url.toLowerCase();
  if (lower.includes('.png')) return 'image/png';
  if (lower.includes('.webp')) return 'image/webp';
  if (lower.includes('.gif')) return 'image/gif';
  return 'image/jpeg';
}

function fileNameFromUrl(url: string): string {
  try {
    return new URL(url).pathname.split('/').pop() || 'image.jpg';
  } catch {
    return url.split('/').pop() || 'image.jpg';
  }
}

async function optimizeExistingUrl(
  s3: S3Service,
  optimizer: ImageOptimizationService,
  url: string,
  imageType: ImageOptimizationType,
  entityId: string,
): Promise<OptimizedImageAsset> {
  const { buffer, contentType } = await s3.getObjectBuffer(url);
  return optimizer.processBufferAndUpload(
    buffer,
    fileNameFromUrl(url),
    guessMime(url, contentType),
    imageType,
    entityId,
  );
}

function productColumnsFromAsset(asset: OptimizedImageAsset) {
  return {
    webp400: asset.webp400 ?? null,
    webp800: asset.webp800 ?? null,
    webp1200: asset.webp1200 ?? null,
  };
}

async function migrateProductImages(
  repo: Repository<ProductImage>,
  s3: S3Service,
  optimizer: ImageOptimizationService,
) {
  const qb = repo
    .createQueryBuilder('img')
    .where('img.webp400 IS NULL')
    .andWhere('img.webp800 IS NULL')
    .andWhere('img.originalUrl IS NOT NULL')
    .andWhere("img.originalUrl <> ''");
  if (LIMIT) qb.take(LIMIT);
  const rows = await qb.getMany();
  console.log(`Product images to migrate: ${rows.length}`);

  for (const row of rows) {
    try {
      if (DRY_RUN) {
        console.log(`[dry-run] product_image#${row.id}`);
        continue;
      }
      const result = await optimizeExistingUrl(
        s3,
        optimizer,
        row.originalUrl,
        'product',
        `legacy-product-img-${row.id}`,
      );
      Object.assign(row, productColumnsFromAsset(result));
      await repo.save(row);
      console.log(`✓ product_image#${row.id}`);
    } catch (error) {
      console.error(
        `✗ product_image#${row.id}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }
}

async function migrateVariantImages(
  repo: Repository<VariantImage>,
  s3: S3Service,
  optimizer: ImageOptimizationService,
) {
  const qb = repo
    .createQueryBuilder('img')
    .where('img.webp400 IS NULL')
    .andWhere('img.webp800 IS NULL')
    .andWhere('img.originalUrl IS NOT NULL')
    .andWhere("img.originalUrl <> ''");
  if (LIMIT) qb.take(LIMIT);
  const rows = await qb.getMany();
  console.log(`Variant images to migrate: ${rows.length}`);

  for (const row of rows) {
    try {
      if (DRY_RUN) {
        console.log(`[dry-run] variant_image#${row.id}`);
        continue;
      }
      const result = await optimizeExistingUrl(
        s3,
        optimizer,
        row.originalUrl,
        'product',
        `legacy-variant-img-${row.id}`,
      );
      Object.assign(row, productColumnsFromAsset(result));
      await repo.save(row);
      console.log(`✓ variant_image#${row.id}`);
    } catch (error) {
      console.error(
        `✗ variant_image#${row.id}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }
}

async function migrateCategories(
  categoryRepo: Repository<Category>,
  s3: S3Service,
  optimizer: ImageOptimizationService,
) {
  const rows = await categoryRepo
    .createQueryBuilder('c')
    .where('c.image IS NOT NULL')
    .andWhere("c.image <> ''")
    .andWhere("c.image NOT ILIKE '%.webp'")
    .take(LIMIT)
    .getMany();

  console.log(`Categories to convert to WebP: ${rows.length}`);

  for (const row of rows) {
    try {
      if (!row.image?.trim()) continue;
      if (DRY_RUN) {
        console.log(`[dry-run] category#${row.id}`);
        continue;
      }
      const result = await optimizeExistingUrl(
        s3,
        optimizer,
        row.image,
        'category',
        `category-${row.id}`,
      );
      row.image = result.Location;
      await categoryRepo.save(row);
      console.log(`✓ category#${row.id}`);
    } catch (error) {
      console.error(
        `✗ category#${row.id}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }
}

async function migrateBlogs(
  blogRepo: Repository<BlogPost>,
  s3: S3Service,
  optimizer: ImageOptimizationService,
) {
  const rows = await blogRepo
    .createQueryBuilder('b')
    .where('b.blogImage IS NOT NULL')
    .andWhere("b.blogImage <> ''")
    .andWhere("b.blogImage NOT ILIKE '%.webp'")
    .take(LIMIT)
    .getMany();

  console.log(`Blogs to convert to WebP: ${rows.length}`);

  for (const row of rows) {
    try {
      if (!row.blogImage?.trim()) continue;
      if (DRY_RUN) {
        console.log(`[dry-run] blog#${row.id}`);
        continue;
      }
      const result = await optimizeExistingUrl(
        s3,
        optimizer,
        row.blogImage,
        'blog',
        `blog-${row.id}`,
      );
      row.blogImage = result.Location;
      await blogRepo.save(row);
      console.log(`✓ blog#${row.id}`);
    } catch (error) {
      console.error(
        `✗ blog#${row.id}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }
}

async function migrateBanners(
  bannerRepo: Repository<Banner>,
  s3: S3Service,
  optimizer: ImageOptimizationService,
) {
  const rows = await bannerRepo.find({ take: LIMIT });
  console.log(`Banners to convert to WebP: ${rows.length}`);

  for (const row of rows) {
    try {
      if (DRY_RUN) {
        console.log(`[dry-run] banner#${row.id}`);
        continue;
      }
      let changed = false;
      if (row.image && !row.image.toLowerCase().endsWith('.webp')) {
        const result = await optimizeExistingUrl(
          s3,
          optimizer,
          row.image,
          'banner',
          `banner-${row.id}`,
        );
        row.image = result.Location;
        changed = true;
      }
      if (row.mobileImage && !row.mobileImage.toLowerCase().endsWith('.webp')) {
        const result = await optimizeExistingUrl(
          s3,
          optimizer,
          row.mobileImage,
          'banner_mobile',
          `banner-mobile-${row.id}`,
        );
        row.mobileImage = result.Location;
        changed = true;
      }
      if (changed) {
        await bannerRepo.save(row);
        console.log(`✓ banner#${row.id}`);
      }
    } catch (error) {
      console.error(
        `✗ banner#${row.id}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const s3 = app.get(S3Service);
    const optimizer = app.get(ImageOptimizationService);

    await migrateProductImages(
      app.get(getRepositoryToken(ProductImage)),
      s3,
      optimizer,
    );
    await migrateVariantImages(
      app.get(getRepositoryToken(VariantImage)),
      s3,
      optimizer,
    );
    await migrateCategories(
      app.get(getRepositoryToken(Category)),
      s3,
      optimizer,
    );
    await migrateBlogs(app.get(getRepositoryToken(BlogPost)), s3, optimizer);
    await migrateBanners(app.get(getRepositoryToken(Banner)), s3, optimizer);

    console.log(
      DRY_RUN
        ? 'Dry run complete — no changes written.'
        : 'Migration complete.',
    );
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

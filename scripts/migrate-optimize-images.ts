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
import { DataSource, IsNull, Repository } from 'typeorm';
import { ProductImage } from '../src/entities/product/product-images.entity';
import { VariantImage } from '../src/entities/product/variant-image.entity';
import { Category } from '../src/entities/productCategory/category.entity';
import { CategoryImage } from '../src/entities/productCategory/category-image.entity';
import { BlogPost } from '../src/entities/blog/blog-posts.entity';
import { BlogImage } from '../src/entities/blog/blog-image.entity';
import { Banner } from '../src/entities/CMS/banner.entity';
import {
  BannerImage,
  BannerImageRole,
} from '../src/entities/CMS/banner-image.entity';
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
    jpg400: asset.jpg400 ?? null,
    webp800: asset.webp800 ?? null,
    jpg800: asset.jpg800 ?? null,
    webp1200: asset.webp1200 ?? null,
    jpg1200: asset.jpg1200 ?? null,
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
  dataSource: DataSource,
  imageRepo: Repository<CategoryImage>,
  s3: S3Service,
  optimizer: ImageOptimizationService,
) {
  // Prefer raw SQL so we can still read legacy category columns if they exist.
  let rows: Array<{
    id: number;
    image: string | null;
    image3d: string | null;
    video: string | null;
    imageAltText: string | null;
  }> = [];

  try {
    rows = await dataSource.query(`
      SELECT c.id,
             c.image,
             c."image3d" AS "image3d",
             c.video,
             c."imageAltText" AS "imageAltText"
      FROM categories c
      LEFT JOIN category_images img ON img."categoryId" = c.id
      WHERE img.id IS NULL
        AND c.image IS NOT NULL
        AND c.image <> ''
      ${LIMIT ? `LIMIT ${Number(LIMIT)}` : ''}
    `);
  } catch {
    console.log(
      'Categories migrate: legacy image columns not found (already removed). Skipping.',
    );
    return;
  }

  console.log(`Categories to migrate: ${rows.length}`);

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
        `legacy-category-${row.id}`,
      );
      await imageRepo.save(
        imageRepo.create({
          originalUrl: row.image,
          webp400: result.webp400 ?? null,
          jpg400: result.jpg400 ?? null,
          webp800: result.webp800 ?? null,
          jpg800: result.jpg800 ?? null,
          altText: row.imageAltText || null,
          image3d: row.image3d || null,
          video: row.video || null,
          sortOrder: 0,
          category: { id: row.id } as Category,
        }),
      );
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
  dataSource: DataSource,
  imageRepo: Repository<BlogImage>,
  s3: S3Service,
  optimizer: ImageOptimizationService,
) {
  let rows: Array<{
    id: number;
    blogImage: string | null;
    blogImageAlt: string | null;
  }> = [];

  try {
    rows = await dataSource.query(`
      SELECT b.id,
             b."blogImage" AS "blogImage",
             b."blogImageAlt" AS "blogImageAlt"
      FROM blog_posts b
      LEFT JOIN blog_images img ON img."blogId" = b.id
      WHERE img.id IS NULL
        AND b."blogImage" IS NOT NULL
        AND b."blogImage" <> ''
      ${LIMIT ? `LIMIT ${Number(LIMIT)}` : ''}
    `);
  } catch {
    // Also try migrating from thumbnail if main was empty (legacy only).
    try {
      rows = await dataSource.query(`
        SELECT b.id,
               COALESCE(NULLIF(b."blogImage", ''), b."thumbnailImage") AS "blogImage",
               b."blogImageAlt" AS "blogImageAlt"
        FROM blog_posts b
        LEFT JOIN blog_images img ON img."blogId" = b.id
        WHERE img.id IS NULL
          AND (
            (b."blogImage" IS NOT NULL AND b."blogImage" <> '')
            OR (b."thumbnailImage" IS NOT NULL AND b."thumbnailImage" <> '')
          )
        ${LIMIT ? `LIMIT ${Number(LIMIT)}` : ''}
      `);
    } catch {
      console.log(
        'Blogs migrate: legacy image columns not found (already removed). Skipping.',
      );
      return;
    }
  }

  console.log(`Blogs to migrate: ${rows.length}`);

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
        `legacy-blog-${row.id}`,
      );
      await imageRepo.save(
        imageRepo.create({
          originalUrl: row.blogImage,
          webp400: result.webp400 ?? null,
          jpg400: result.jpg400 ?? null,
          webp800: result.webp800 ?? null,
          jpg800: result.jpg800 ?? null,
          webp1200: result.webp1200 ?? null,
          jpg1200: result.jpg1200 ?? null,
          altText: row.blogImageAlt,
          sortOrder: 0,
          blog: { id: row.id } as BlogPost,
        }),
      );
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
  dataSource: DataSource,
  imageRepo: Repository<BannerImage>,
  s3: S3Service,
  optimizer: ImageOptimizationService,
) {
  let rows: Array<{
    id: number;
    image: string | null;
    mobileImage: string | null;
  }> = [];

  try {
    rows = await dataSource.query(`
      SELECT b.id,
             b.image,
             b."mobileImage" AS "mobileImage"
      FROM banners b
      LEFT JOIN banner_images img ON img."bannerId" = b.id
      WHERE img.id IS NULL
        AND (
          (b.image IS NOT NULL AND b.image <> '')
          OR (b."mobileImage" IS NOT NULL AND b."mobileImage" <> '')
        )
      ${LIMIT ? `LIMIT ${Number(LIMIT)}` : ''}
    `);
  } catch {
    console.log(
      'Banners migrate: legacy image columns not found (already removed). Skipping.',
    );
    return;
  }

  console.log(`Banners to migrate: ${rows.length}`);

  for (const row of rows) {
    try {
      if (DRY_RUN) {
        console.log(`[dry-run] banner#${row.id}`);
        continue;
      }
      if (row.image) {
        const result = await optimizeExistingUrl(
          s3,
          optimizer,
          row.image,
          'banner',
          `legacy-banner-${row.id}`,
        );
        await imageRepo.save(
          imageRepo.create({
            originalUrl: row.image,
            webp1440: result.webp1440 ?? null,
            jpg1440: result.jpg1440 ?? null,
            webp1920: result.webp1920 ?? null,
            jpg1920: result.jpg1920 ?? null,
            role: BannerImageRole.DESKTOP,
            sortOrder: 0,
            banner: { id: row.id } as Banner,
          }),
        );
      }
      if (row.mobileImage) {
        const result = await optimizeExistingUrl(
          s3,
          optimizer,
          row.mobileImage,
          'banner_mobile',
          `legacy-banner-mobile-${row.id}`,
        );
        await imageRepo.save(
          imageRepo.create({
            originalUrl: row.mobileImage,
            webp800: result.webp800 ?? null,
            jpg800: result.jpg800 ?? null,
            webp1200: result.webp1200 ?? null,
            jpg1200: result.jpg1200 ?? null,
            role: BannerImageRole.MOBILE,
            sortOrder: 1,
            banner: { id: row.id } as Banner,
          }),
        );
      }
      console.log(`✓ banner#${row.id}`);
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
      app.get(DataSource),
      app.get(getRepositoryToken(CategoryImage)),
      s3,
      optimizer,
    );
    await migrateBlogs(
      app.get(DataSource),
      app.get(getRepositoryToken(BlogImage)),
      s3,
      optimizer,
    );
    await migrateBanners(
      app.get(DataSource),
      app.get(getRepositoryToken(BannerImage)),
      s3,
      optimizer,
    );

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

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Product } from 'src/entities/product/product.entity';
import { ProductVariant } from 'src/entities/product/product-variants.entity';
import { VariantImage } from 'src/entities/product/variant-image.entity';
import { Attribute } from 'src/entities/product/attribute.entity';
import {
  AtttributeViewOption,
  VariantAttribute,
} from 'src/entities/product/product-variant-attribute.entity';
import { UpdateVariantDto } from 'src/dto/product.dto';
import { productImageColumnFields } from 'src/commonServices/image-asset.util';
import { UtilityService } from 'src/commonServices/utility.service';

export function normalizeVariantImageUrls(
  images: unknown[] | null | undefined,
): string[] {
  if (!images) return [];

  const seen = new Set<string>();
  return images
    .map((image) => {
      if (typeof image === 'string') {
        return image.trim();
      }
      if (image && typeof image === 'object') {
        const record = image as Record<string, unknown>;
        const url = [
          record.originalUrl,
          record.url,
          record.image,
          record.Location,
        ].find((value): value is string => typeof value === 'string');
        return url?.trim() ?? '';
      }
      return '';
    })
    .filter((value) => {
      if (!value) return false;
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
}

export function hasVariantImageChanged(
  existing: string[] | null | undefined,
  incoming: string[] | null | undefined,
): boolean {
  const normalizedExisting = [
    ...new Set((existing ?? []).map((url) => url.trim()).filter(Boolean)),
  ];
  const normalizedIncoming = [
    ...new Set((incoming ?? []).map((url) => url.trim()).filter(Boolean)),
  ];

  if (normalizedExisting.length !== normalizedIncoming.length) {
    return true;
  }

  return normalizedExisting.some(
    (url, index) => url !== normalizedIncoming[index],
  );
}

@Injectable()
export class UpdateProductVariantService {
  constructor(
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
    @InjectRepository(VariantImage)
    private readonly variantImageRepo: Repository<VariantImage>,
    @InjectRepository(VariantAttribute)
    private readonly variantAttributeRepo: Repository<VariantAttribute>,
    @InjectRepository(Attribute)
    private readonly attributeRepo: Repository<Attribute>,
    private readonly utilityService: UtilityService,
  ) {}

  async updateVariants(
    product: Product,
    variants: UpdateVariantDto[],
  ) {
    const existing = await this.variantRepo.find({
      where: { product: { id: product.id } },
    });

    const existingMap = new Map(existing.map((v) => [Number(v.id), v]));
    const incomingIds = variants.filter((v) => v.id).map((v) => Number(v.id));

    const toDelete = existing.filter(
      (v) => !incomingIds.includes(Number(v.id)),
    );
    if (toDelete.length) {
      await this.variantRepo.remove(toDelete);
    }

    for (const v of variants) {
      let savedVariant: ProductVariant;

      if (v.id) {
        const existingVariant = existingMap.get(Number(v.id));
        if (!existingVariant) {
          throw new BadRequestException(`Variant ${v.id} not found`);
        }

        const variantName = (v.name ?? existingVariant.name)?.trim();
        if (!variantName) {
          throw new BadRequestException('Variant name is required');
        }

        const sku = v.sku?.trim();
        if (!sku) {
          throw new BadRequestException('Variant SKU is required');
        }

        existingVariant.name = variantName;
        existingVariant.price = v.price ?? existingVariant.price;
        existingVariant.stock = v.stock ?? existingVariant.stock;
        existingVariant.packageHeightCm = v.packageHeightCm;
        existingVariant.packageWidthCm = v.packageWidthCm;
        existingVariant.packageLengthCm = v.packageLengthCm;
        existingVariant.packageWeightGrams = v.packageWeightGrams;
        existingVariant.sku = sku;
        if (v.name !== undefined || !existingVariant.slug) {
          existingVariant.slug = await this.generateUniqueVariantSlug(
            variantName,
            existingVariant.id,
          );
        }
        if (v.description !== undefined) {
          existingVariant.description = v.description ?? null;
        }

        savedVariant = await this.variantRepo.save(existingVariant);
      } else {
        const variantName = v.name?.trim();
        if (!variantName) {
          throw new BadRequestException('Variant name is required');
        }

        const sku = v.sku?.trim();
        if (!sku) {
          throw new BadRequestException('Variant SKU is required');
        }

        const newVariant = this.variantRepo.create({
          name: variantName,
          price: v.price,
          stock: v.stock,
          packageHeightCm: v.packageHeightCm,
          packageWidthCm: v.packageWidthCm,
          packageLengthCm: v.packageLengthCm,
          packageWeightGrams: v.packageWeightGrams,
          sku,
          slug: await this.generateUniqueVariantSlug(variantName),
          description: v.description ?? null,
          product: { id: product.id },
        });

        savedVariant = await this.variantRepo.save(newVariant);
      }

      if (v.images !== undefined) {
        const existingImages = await this.variantImageRepo.find({
          where: { variant: { id: savedVariant.id } },
          order: { sortOrder: 'ASC', id: 'ASC' },
        });

        const existingUrls = existingImages.map((image) =>
          (image.originalUrl ?? '').trim(),
        );
        const incomingUrls = normalizeVariantImageUrls(v.images);

        const imageChanged = hasVariantImageChanged(existingUrls, incomingUrls);

        if (imageChanged) {
          await this.variantImageRepo.delete({
            variant: { id: savedVariant.id },
          });

          if (v.images.length) {
            const images = v.images.map((img) =>
              this.variantImageRepo.create({
                ...productImageColumnFields(img),
                sortOrder: img.sortOrder ?? 0,
                variant: { id: savedVariant.id },
              }),
            );

            await this.variantImageRepo.save(images);
          }
        }
      }

      if (v.variantAttributes !== undefined) {
        await this.variantAttributeRepo.delete({
          variant: { id: savedVariant.id },
        });

        if (v.variantAttributes.length) {
          await this.saveVariantAttributes(
            savedVariant.id,
            v.variantAttributes,
          );
        }
      }
    }
  }

  private async generateUniqueVariantSlug(
    variantName: string,
    excludeId?: number,
  ): Promise<string> {
      const baseSlug = this.utilityService.createSlug(variantName) || 'variant';
      let slug = baseSlug;
      let suffix = 2;
      let existing = await this.variantRepo.findOne({
        where: { slug },
        select: { id: true },
      });

      while (existing && existing.id !== excludeId) {
        slug = `${baseSlug}-${suffix}`;
        suffix += 1;
        existing = await this.variantRepo.findOne({
          where: { slug },
          select: { id: true },
        });
      }

    return slug;
  }

  private async saveVariantAttributes(
    variantId: number,
    variantAttributes: NonNullable<UpdateVariantDto['variantAttributes']>,
  ) {
    const attributeIds = variantAttributes.map((va) => va.attributeId);
    const uniqueIds = [...new Set(attributeIds)];
    const attributes = await this.attributeRepo.find({
      where: { id: In(uniqueIds) },
    });

    if (attributes.length !== uniqueIds.length) {
      throw new NotFoundException('One or more variant attributes not found');
    }

    const rows = variantAttributes.map((va) =>
      this.variantAttributeRepo.create({
        variant: { id: variantId },
        attribute: { id: va.attributeId },
        value: va.value ?? '',
        code: va.code ?? null,
        image: va.image ?? null,
        viewOption: va.viewOption ?? AtttributeViewOption.VALUE,
      }),
    );

    await this.variantAttributeRepo.save(rows);
  }
}

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
import { Offer } from 'src/entities/product/offer.entity';
import { Attribute } from 'src/entities/product/attribute.entity';
import {
  AtttributeViewOption,
  VariantAttribute,
} from 'src/entities/product/product-variant-attribute.entity';
import { UpdateVariantDto } from 'src/dto/product.dto';

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
    @InjectRepository(Offer)
    private readonly offerRepo: Repository<Offer>,
  ) {}

  async updateVariants(
    product: Product,
    variants: UpdateVariantDto[],
    offerRepo?: Repository<Offer>,
  ) {
    const repo = offerRepo || this.offerRepo;
    const existing = await this.variantRepo.find({
      where: { product: { id: product.id } },
      relations: ['productVariantOffers'],
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

        const variantSlug = (v.slug ?? existingVariant.slug)?.trim();
        if (!variantSlug) {
          throw new BadRequestException('Variant slug is required');
        }

        existingVariant.name = variantName;
        existingVariant.price = v.price ?? existingVariant.price;
        existingVariant.stock = v.stock ?? existingVariant.stock;
        existingVariant.sku = v.sku ?? existingVariant.sku;
        existingVariant.slug = variantSlug;
        if (v.description !== undefined) {
          existingVariant.description = v.description ?? null;
        }

        if (v.productVariantOffers !== undefined) {
          const uniqueIds = [...new Set(v.productVariantOffers)];
          let offers: Offer[] = [];
          if (uniqueIds.length > 0) {
            offers = await repo.find({
              where: { id: In(uniqueIds) },
            });
            if (offers.length !== uniqueIds.length) {
              throw new NotFoundException(
                'One or more variant offers not found',
              );
            }
          }

          // Explicit join-table sync so clearing offers (empty []) actually removes rows.
          const previous = existingVariant.productVariantOffers ?? [];
          const nextIds = new Set(offers.map((o) => o.id));
          const previousIds = new Set(previous.map((o) => o.id));
          const toAdd = offers.filter((o) => !previousIds.has(o.id));
          const toRemove = previous.filter((o) => !nextIds.has(o.id));
          if (toAdd.length || toRemove.length) {
            await this.variantRepo
              .createQueryBuilder()
              .relation(ProductVariant, 'productVariantOffers')
              .of(existingVariant)
              .addAndRemove(toAdd, toRemove);
          }
          existingVariant.productVariantOffers = offers;
        }

        savedVariant = await this.variantRepo.save(existingVariant);
      } else {
        let offers: Offer[] = [];
        if (v.productVariantOffers?.length) {
          const uniqueIds = [...new Set(v.productVariantOffers)];
          offers = await repo.find({
            where: { id: In(uniqueIds) },
          });
          if (offers.length !== uniqueIds.length) {
            throw new NotFoundException('One or more variant offers not found');
          }
        }

        const variantName = v.name?.trim();
        if (!variantName) {
          throw new BadRequestException('Variant name is required');
        }

        const variantSlug = v.slug?.trim();
        if (!variantSlug) {
          throw new BadRequestException('Variant slug is required');
        }

        const newVariant = this.variantRepo.create({
          name: variantName,
          price: v.price,
          stock: v.stock,
          sku: v.sku ?? null,
          slug: variantSlug,
          description: v.description ?? null,
          product: { id: product.id },
          productVariantOffers: offers,
        });

        savedVariant = await this.variantRepo.save(newVariant);
      }

      if (v.images !== undefined) {
        await this.variantImageRepo.delete({
          variant: { id: savedVariant.id },
        });

        if (v.images.length) {
          const images = v.images.map((img) =>
            this.variantImageRepo.create({
              url: img.url,
              sortOrder: img.sortOrder ?? 0,
              variant: { id: savedVariant.id },
            }),
          );

          await this.variantImageRepo.save(images);
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

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
import { CreateVariantDto } from 'src/dto/product.dto';

@Injectable()
export class AddProductVariantService {
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

  async createVariants(
    product: Product,
    variants: CreateVariantDto[],
    offerRepo?: Repository<Offer>,
  ) {
    const repo = offerRepo || this.offerRepo;

    for (const v of variants) {
      const variantName = v.name?.trim();
      if (!variantName) {
        throw new BadRequestException('Variant name is required');
      }

      const variantSlug = v.slug?.trim();
      if (!variantSlug) {
        throw new BadRequestException('Variant slug is required');
      }

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

      const savedVariant = await this.variantRepo.save(newVariant);

      if (v.images?.length) {
        const images = v.images.map((img) =>
          this.variantImageRepo.create({
            url: img.url,
            sortOrder: img.sortOrder ?? 0,
            variant: { id: savedVariant.id },
          }),
        );

        await this.variantImageRepo.save(images);
      }

      if (v.variantAttributes?.length) {
        await this.saveVariantAttributes(savedVariant.id, v.variantAttributes);
      }
    }
  }

  private async saveVariantAttributes(
    variantId: number,
    variantAttributes: CreateVariantDto['variantAttributes'],
  ) {
    if (!variantAttributes?.length) return;

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

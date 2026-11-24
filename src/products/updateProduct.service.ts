import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Product } from 'src/entities/product/product.entity';
import { UpdateProductDto } from 'src/dto/product.dto';
import {
  successResponse,
  errorResponse,
} from 'src/commonServices/response.service';
import { Offer } from 'src/entities/product/offer.entity';
import { UpdateProductVariantService } from './updateProductVariant.service';
import { UpdateProductSeoService } from './updatedProductSeo.service';
import { Tags } from 'src/entities/product/tags.entity';
import { Category } from 'src/entities/productCategory/category.entity';
import { ProductAttribute } from 'src/entities/product/product-attribute.entity';
import { Attribute } from 'src/entities/product/attribute.entity';
import { UtilityService } from 'src/commonServices/utility.service';
import {
  Warehouse,
  WarehouseRegistrationStatus,
} from 'src/entities/product/warehouse.entity';

@Injectable()
export class UpdateProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Offer)
    private readonly offerRepo: Repository<Offer>,
    @InjectRepository(Tags)
    private readonly tagRepo: Repository<Tags>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(ProductAttribute)
    private readonly productAttributeRepo: Repository<ProductAttribute>,
    @InjectRepository(Attribute)
    private readonly attributeRepo: Repository<Attribute>,
    @InjectRepository(Warehouse)
    private readonly warehouseRepo: Repository<Warehouse>,
    private readonly utilityService: UtilityService,
    private readonly productSeoService: UpdateProductSeoService,
    private readonly updateProductVariantService: UpdateProductVariantService,
  ) {}

  async update(id: number, updateProductDto: UpdateProductDto) {
    try {
      const relationsToLoad: string[] = [];
      if (updateProductDto.productOffers !== undefined) {
        relationsToLoad.push('productOffers');
      }
      if (updateProductDto.productTags !== undefined) {
        relationsToLoad.push('productTags');
      }
      if (updateProductDto.frequentlyBoughtTogether !== undefined) {
        relationsToLoad.push('frequentlyBoughtTogether');
      }
      relationsToLoad.push('warehouse');

      const product = await this.productRepo.findOne({
        where: { id },
        relations: relationsToLoad,
        loadEagerRelations: false,
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      if (
        updateProductDto.variants !== undefined &&
        updateProductDto.variants.length < 1
      ) {
        throw new BadRequestException('At least one variant is required');
      }

      /* ================= BASIC UPDATE ================= */

      product.productName = updateProductDto.productName ?? product.productName;
      if (updateProductDto.productName !== undefined || !product.productSlug) {
        product.productSlug = await this.generateUniqueProductSlug(
          product.productName || '',
          id,
        );
      }
      product.shortDescription =
        updateProductDto.shortDescription ?? product.shortDescription;
      product.description = updateProductDto.description ?? product.description;
      product.isActive = updateProductDto.isActive ?? product.isActive;
      product.isFeatured =
        updateProductDto.isFeatured ?? product.isFeatured;
      product.newArrival =
        updateProductDto.newArrival ?? product.newArrival;
      product.bestSeller =
        updateProductDto.bestSeller ?? product.bestSeller;

      /* ================= CATEGORY ================= */
      if (updateProductDto.category) {
        const category = await this.categoryRepo.findOne({
          where: { id: updateProductDto.category },
          loadEagerRelations: false,
        });
        if (!category) throw new NotFoundException('Category not found');
        product.category = category;
      }

      if (updateProductDto.warehouseId !== undefined) {
        if (updateProductDto.warehouseId === null) {
          product.warehouse = null;
          product.warehouseId = null;
        } else {
          const warehouse = await this.warehouseRepo.findOne({
            where: {
              id: updateProductDto.warehouseId,
              isActive: true,
              registrationStatus: WarehouseRegistrationStatus.REGISTERED,
            },
          });
          if (!warehouse) {
            throw new BadRequestException(
              'Select an active, registered pickup warehouse',
            );
          }
          product.warehouse = warehouse;
          product.warehouseId = warehouse.id;
        }
      }

      /* ================= UPDATE PRODUCT OFFERS ================= */
      if (updateProductDto.productOffers !== undefined) {
        const uniqueIds = [...new Set(updateProductDto.productOffers)];
        let offers: Offer[] = [];
        if (uniqueIds.length > 0) {
          offers = await this.offerRepo.find({
            where: { id: In(uniqueIds) },
          });
          if (offers.length !== uniqueIds.length) {
            throw new NotFoundException('One or more offers not found');
          }
        }

        const previous = product.productOffers ?? [];
        const nextIds = new Set(offers.map((o) => o.id));
        const previousIds = new Set(previous.map((o) => o.id));
        const toAdd = offers.filter((o) => !previousIds.has(o.id));
        const toRemove = previous.filter((o) => !nextIds.has(o.id));
        if (toAdd.length || toRemove.length) {
          await this.productRepo
            .createQueryBuilder()
            .relation(Product, 'productOffers')
            .of(product)
            .addAndRemove(toAdd, toRemove);
        }
        product.productOffers = offers;
      }

      /* ================= UPDATE PRODUCT TAGS ================= */
      if (updateProductDto.productTags !== undefined) {
        if (updateProductDto.productTags.length > 0) {
          const uniqueIds = [...new Set(updateProductDto.productTags)];
          const tags = await this.tagRepo.find({
            where: { id: In(uniqueIds) },
          });
          if (tags.length !== uniqueIds.length) {
            throw new NotFoundException('One or more tags not found');
          }
          product.productTags = tags;
        } else {
          product.productTags = [];
        }
      }

      /* ================= FREQUENT PRODUCTS ================= */
      if (updateProductDto.frequentlyBoughtTogether !== undefined) {
        if (updateProductDto.frequentlyBoughtTogether.length > 0) {
          const uniqueIds = [
            ...new Set(updateProductDto.frequentlyBoughtTogether),
          ];
          const frequentlyBoughtProducts = await this.productRepo.find({
            where: { id: In(uniqueIds) },
          });
          if (frequentlyBoughtProducts.length !== uniqueIds.length) {
            throw new NotFoundException('Invalid frequently bought products');
          }
          product.frequentlyBoughtTogether = frequentlyBoughtProducts;
        } else {
          product.frequentlyBoughtTogether = [];
        }
      }

      const savedProduct = await this.productRepo.save(product);

      /* ================= PRODUCT ATTRIBUTES ================= */
      if (updateProductDto.attributes !== undefined) {
        await this.productAttributeRepo.delete({ product: { id: product.id } });

        if (updateProductDto.attributes.length) {
          const attributeIds = updateProductDto.attributes.map(
            (attr) => attr.attributeId,
          );
          const uniqueIds = [...new Set(attributeIds)];

          if (uniqueIds.length !== attributeIds.length) {
            throw new BadRequestException(
              'Duplicate attribute IDs are not allowed',
            );
          }

          const attributes = await this.attributeRepo.find({
            where: { id: In(uniqueIds) },
          });

          if (attributes.length !== uniqueIds.length) {
            throw new NotFoundException('One or more attributes not found');
          }

          const productAttributes = uniqueIds.map((attributeId) =>
            this.productAttributeRepo.create({
              product: { id: product.id },
              attribute: { id: attributeId },
            }),
          );

          await this.productAttributeRepo.save(productAttributes);
        }
      }

      /* ================= VARIANTS ================= */
      if (updateProductDto.variants !== undefined) {
        await this.updateProductVariantService.updateVariants(
          savedProduct,
          updateProductDto.variants,
        );
      }

      /* ================= SEO ================= */
      if (updateProductDto.seo) {
        await this.productSeoService.updateSeo(product, updateProductDto.seo);
      }
      /* ✅ IMPORTANT: Reload updated product */
      const updatedProduct = await this.productRepo.findOne({
        where: { id: product.id },
        relations: [
          'category',
          'warehouse',
          'variants',
          'variants.images',
          'variants.variantAttributes',
          'variants.variantAttributes.attribute',
          'seo',
          'productTags',
          'productOffers',
          'frequentlyBoughtTogether',
          'productAttributes',
          'productAttributes.attribute',
          'reviews',
        ],
        loadEagerRelations: false,
        relationLoadStrategy: 'query',
      });

      return successResponse(
        updatedProduct,
        'Product updated successfully',
        200,
      );
    } catch (error) {
      throw error;
    }
  }

  private async generateUniqueProductSlug(
    productName: string,
    excludeId?: number,
  ): Promise<string> {
    const baseSlug = this.utilityService.createSlug(productName) || 'product';
    let slug = baseSlug;
    let suffix = 2;
    let existing = await this.productRepo.findOne({
      where: { productSlug: slug },
      select: { id: true },
    });

    while (existing && existing.id !== excludeId) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
      existing = await this.productRepo.findOne({
        where: { productSlug: slug },
        select: { id: true },
      });
    }

    return slug;
  }
}

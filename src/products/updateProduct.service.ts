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
import { Brand } from 'src/entities/product/brand.entity';
import { ProductAttribute } from 'src/entities/product/product-attribute.entity';
import { Attribute } from 'src/entities/product/attribute.entity';
import { ProductImage } from 'src/entities/product/product-images.entity';

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
    @InjectRepository(Brand)
    private readonly brandRepo: Repository<Brand>,
    @InjectRepository(ProductAttribute)
    private readonly productAttributeRepo: Repository<ProductAttribute>,
    @InjectRepository(Attribute)
    private readonly attributeRepo: Repository<Attribute>,
    @InjectRepository(ProductImage)
    private readonly productImageRepo: Repository<ProductImage>,
    private readonly productSeoService: UpdateProductSeoService,
    private readonly updateProductVariantService: UpdateProductVariantService,
  ) {}

  async update(id: number, updateProductDto: UpdateProductDto) {
    try {
      const product = await this.productRepo.findOne({
        where: { id },
        relations: [
          'variants',
          'variants.images',
          'variants.productVariantOffers',
          'seo',
          'productTags',
          'productOffers',
          'frequentlyBoughtTogether',
          'images',
          'productAttributes',
          'productAttributes.attribute',
        ],
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

      if (
        updateProductDto.images !== undefined &&
        updateProductDto.images.length < 1
      ) {
        throw new BadRequestException('At least one product image is required');
      }

      /* ================= BASIC UPDATE ================= */

      product.productName = updateProductDto.productName ?? product.productName;
      product.productSlug = updateProductDto.productSlug ?? product.productSlug;
      product.shortDescription =
        updateProductDto.shortDescription ?? product.shortDescription;
      product.description = updateProductDto.description ?? product.description;
      product.isActive = updateProductDto.isActive ?? product.isActive;
      product.publishStatus =
        updateProductDto.publishStatus ?? product.publishStatus;

      /* ================= CATEGORY ================= */
      if (updateProductDto.category) {
        const category = await this.categoryRepo.findOne({
          where: { id: updateProductDto.category },
        });
        if (!category) throw new NotFoundException('Category not found');
        product.category = category;
      }

      /* ================= BRAND ================= */
      const brand: Brand | null = null;
      if (updateProductDto.brandId) {
        const brand = await this.brandRepo.findOne({
          where: { id: updateProductDto.brandId },
        });

        if (!brand) throw new NotFoundException('Brand not found');
        product.brand = brand;
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

      /* ================= PRODUCT IMAGES ================= */
      if (updateProductDto.images !== undefined) {
        await this.productImageRepo.delete({ product: { id: product.id } });

        if (updateProductDto.images.length) {
          const images = updateProductDto.images.map((img) =>
            this.productImageRepo.create({
              url: img.url,
              sortOrder: img.sortOrder ?? 0,
              product: { id: product.id },
            }),
          );

          await this.productImageRepo.save(images);
        }
      }

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
          this.offerRepo,
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
          'variants',
          'variants.images',
          'variants.variantAttributes',
          'variants.variantAttributes.attribute',
          'variants.productVariantOffers',
          'seo',
          'productTags',
          'productOffers',
          'frequentlyBoughtTogether',
          'images',
          'productAttributes',
          'productAttributes.attribute',
        ],
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
}

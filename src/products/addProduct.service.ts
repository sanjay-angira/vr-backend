import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Category } from '../entities/productCategory/category.entity';
import { Product, PublishStatus } from 'src/entities/product/product.entity';
import { CreateProductDto } from 'src/dto/product.dto';
import {
  successResponse,
  errorResponse,
} from 'src/commonServices/response.service';
import { Tags } from 'src/entities/product/tags.entity';
import { Offer } from 'src/entities/product/offer.entity';
import { Brand } from 'src/entities/product/brand.entity';
import { ProductImage } from 'src/entities/product/product-images.entity';
import { ProductAttribute } from 'src/entities/product/product-attribute.entity';
import { Attribute } from 'src/entities/product/attribute.entity';
import { AddProductSeoService } from './addProductSeo.service';
import { AddProductVariantService } from './addProductVariant.service';
import { productImageColumnFields } from 'src/commonServices/image-asset.util';

@Injectable()
export class AddProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Brand)
    private readonly brandRepo: Repository<Brand>,
    @InjectRepository(Offer)
    private readonly offerRepo: Repository<Offer>,
    @InjectRepository(Tags)
    private readonly tagRepo: Repository<Tags>,
    @InjectRepository(ProductImage)
    private readonly productImageRepo: Repository<ProductImage>,
    @InjectRepository(ProductAttribute)
    private readonly productAttributeRepo: Repository<ProductAttribute>,
    @InjectRepository(Attribute)
    private readonly attributeRepo: Repository<Attribute>,
    private readonly addProductVariantService: AddProductVariantService,
    private readonly addProductSeoService: AddProductSeoService,
  ) {}

  async create(createProductDto: CreateProductDto) {
    try {
      if (!createProductDto.variants?.length) {
        throw new BadRequestException('At least one variant is required');
      }

      if (!createProductDto.images?.length) {
        throw new BadRequestException('At least one product image is required');
      }

      /* ================= CATEGORY ================= */
      let category: Category | null = null;
      if (createProductDto.category) {
        category = await this.categoryRepo.findOne({
          where: { id: createProductDto.category },
        });

        if (!category) throw new NotFoundException('Category not found');
      }

      /* ================= BRAND ================= */
      let brand: Brand | null = null;
      if (createProductDto.brandId) {
        brand = await this.brandRepo.findOne({
          where: { id: createProductDto.brandId },
        });

        if (!brand) throw new NotFoundException('Brand not found');
      }

      /* ================= OFFERS ================= */
      let offers: Offer[] = [];
      if (createProductDto.productOffers?.length) {
        const uniqueIds = [...new Set(createProductDto.productOffers)];

        offers = await this.offerRepo.find({
          where: { id: In(uniqueIds) },
        });

        if (offers.length !== uniqueIds.length) {
          throw new NotFoundException('One or more offers not found');
        }
      }

      /* ================= TAGS ================= */
      let tags: Tags[] = [];
      if (createProductDto.productTags?.length) {
        const uniqueIds = [...new Set(createProductDto.productTags)];

        tags = await this.tagRepo.find({
          where: { id: In(uniqueIds) },
        });

        if (tags.length !== uniqueIds.length) {
          throw new NotFoundException('One or more tags not found');
        }
      }

      /* ================= FREQUENT PRODUCTS ================= */
      let frequentlyBoughtProducts: Product[] = [];
      if (createProductDto.frequentlyBoughtTogether?.length) {
        const uniqueIds = [
          ...new Set(createProductDto.frequentlyBoughtTogether),
        ];

        frequentlyBoughtProducts = await this.productRepo.find({
          where: { id: In(uniqueIds) },
        });

        if (frequentlyBoughtProducts.length !== uniqueIds.length) {
          throw new NotFoundException('Invalid frequently bought products');
        }

        const inactive = frequentlyBoughtProducts.find((p) => !p.isActive);
        if (inactive) {
          throw new BadRequestException(
            `Product ID ${inactive.id} is inactive`,
          );
        }
      }

      /* ================= CREATE PRODUCT ================= */
      const product = this.productRepo.create({
        productName: createProductDto.productName,
        productSlug: createProductDto.productSlug,
        shortDescription: createProductDto.shortDescription ?? null,
        description: createProductDto.description ?? null,
        isActive: createProductDto.isActive ?? true,
        publishStatus: createProductDto.publishStatus ?? PublishStatus.DRAFT,
        category: category ?? undefined,
        brand: brand ?? undefined,
        productOffers: offers,
        frequentlyBoughtTogether: frequentlyBoughtProducts,
      });

      const savedProduct = await this.productRepo.save(product);

      /* ================= PRODUCT IMAGES ================= */
      if (createProductDto.images?.length) {
        const images = createProductDto.images.map((img) =>
          this.productImageRepo.create({
            ...productImageColumnFields(img),
            sortOrder: img.sortOrder ?? 0,
            product: { id: savedProduct.id },
          }),
        );

        await this.productImageRepo.save(images);
      }

      /* ================= VARIANTS ================= */
      await this.addProductVariantService.createVariants(
        savedProduct,
        createProductDto.variants,
        this.offerRepo,
      );

      /* ================= TAG BIND ================= */
      if (tags.length) {
        for (const tag of tags) {
          tag.product = savedProduct;
        }
        await this.tagRepo.save(tags);
      }

      /* ================= PRODUCT ATTRIBUTES ================= */
      if (createProductDto.attributes?.length) {
        const attributeIds = createProductDto.attributes.map(
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
            product: { id: savedProduct.id },
            attribute: { id: attributeId },
          }),
        );

        await this.productAttributeRepo.save(productAttributes);
      }

      /* ================= SEO ================= */
      if (createProductDto.seo) {
        await this.addProductSeoService.addSeo(
          savedProduct,
          createProductDto.seo,
        );
      }

      const createdProduct = await this.productRepo.findOne({
        where: { id: savedProduct.id },
        relations: [
          'variants',
          'variants.images',
          'variants.variantAttributes',
          'variants.variantAttributes.attribute',
          'variants.productVariantOffers',
          'productAttributes',
          'productAttributes.attribute',
          'images',
          'seo',
          'productTags',
          'productOffers',
          'category',
          'brand',
        ],
      });

      return successResponse(
        createdProduct ?? savedProduct,
        'Product created successfully',
        201,
      );
    } catch (error) {
      throw error;
    }
  }
}

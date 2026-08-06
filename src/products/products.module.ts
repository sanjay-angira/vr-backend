import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Category } from '../entities/productCategory/category.entity';
import { CommonModule } from 'src/commonServices/common.module';
import { ProductVariant } from 'src/entities/product/product-variants.entity';
import { Tags } from 'src/entities/product/tags.entity';
import { Offer } from 'src/entities/product/offer.entity';
import { Brand } from 'src/entities/product/brand.entity';
import { Faq } from 'src/entities/product/faq.entity';
import { Product } from 'src/entities/product/product.entity';
import { ProductSeo } from 'src/entities/product/product-seo.entity';
import { ProductAttribute } from 'src/entities/product/product-attribute.entity';
import { Attribute } from 'src/entities/product/attribute.entity';
import { VariantAttribute } from 'src/entities/product/product-variant-attribute.entity';
import { ProductImage } from 'src/entities/product/product-images.entity';
import { VariantImage } from 'src/entities/product/variant-image.entity';
import { UpdateProductService } from './updateProduct.service';
import { AddProductService } from './addProduct.service';
import { AddProductSeoService } from './addProductSeo.service';
import { AddProductVariantService } from './addProductVariant.service';
import { UpdateProductVariantService } from './updateProductVariant.service';
import { UpdateProductSeoService } from './updatedProductSeo.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductSeo,
      ProductAttribute,
      Attribute,
      VariantAttribute,
      ProductVariant,
      Category,
      Offer,
      Tags,
      Brand,
      Faq,
      ProductImage,
      VariantImage,
    ]),
    CommonModule,
  ],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    AddProductService,
    AddProductSeoService,
    AddProductVariantService,
    UpdateProductService,
    UpdateProductSeoService,
    UpdateProductVariantService,
  ],
})
export class ProductsModule {}

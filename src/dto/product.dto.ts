import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
  IsInt,
} from 'class-validator';
import { PublishStatus } from 'src/entities/product/product.entity';
import { AtttributeViewOption } from 'src/entities/product/product-variant-attribute.entity';

export class ProductAttributeDto {
  @Type(() => Number)
  @IsNumber()
  attributeId!: number;
}

export class VariantAttributeDto {
  @Type(() => Number)
  @IsNumber()
  attributeId!: number;

  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsEnum(AtttributeViewOption)
  viewOption?: AtttributeViewOption;
}

/** Product/variant image input — original URL. Size columns filled server-side. */
export class ImageInputDto {
  @ValidateIf((o: ImageInputDto) => !o.url?.trim())
  @IsString()
  @IsNotEmpty()
  originalUrl?: string;

  /** @deprecated Prefer originalUrl — still accepted for older clients. */
  @ValidateIf((o: ImageInputDto) => !o.originalUrl?.trim())
  @IsString()
  @IsNotEmpty()
  url?: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CreateVariantDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  slug!: string;

  @IsNumber()
  price!: number;

  @IsNumber()
  stock!: number;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageInputDto)
  images?: ImageInputDto[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  productVariantOffers?: number[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantAttributeDto)
  variantAttributes?: VariantAttributeDto[];
}

export class CreateProductSeoDto {
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;

  @IsOptional()
  @IsString()
  metaKeywords?: string;

  @IsOptional()
  @IsString()
  focusKeyword?: string;

  @IsOptional()
  @IsString()
  canonicalUrl?: string;

  @IsOptional()
  @IsString()
  metaRobots?: string;

  @IsOptional()
  @IsString()
  ogTitle?: string;

  @IsOptional()
  @IsString()
  ogDescription?: string;

  @IsOptional()
  @IsString()
  ogImage?: string;

  @IsOptional()
  @IsString()
  twitterCard?: string;

  @IsOptional()
  @IsString()
  twitterTitle?: string;

  @IsOptional()
  @IsString()
  twitterDescription?: string;

  @IsOptional()
  @IsString()
  twitterImage?: string;

  @IsOptional()
  @IsString()
  schemaType?: string;

  @IsOptional()
  @IsString()
  breadcrumbsTitle?: string;

  @IsOptional()
  @IsString()
  primaryKeywordDensity?: string;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  productName!: string;

  @IsString()
  @IsNotEmpty()
  productSlug!: string;

  @IsString()
  @IsOptional()
  shortDescription?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsEnum(PublishStatus)
  @IsOptional()
  publishStatus?: PublishStatus;

  @IsNumber()
  @IsOptional()
  brandId?: number;

  @IsNumber()
  @IsOptional()
  category?: number;

  @IsArray()
  @IsOptional()
  @IsNumber({}, { each: true })
  productOffers?: number[];

  @IsArray()
  @IsOptional()
  @IsNumber({}, { each: true })
  productTags?: number[];

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one variant is required' })
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants!: CreateVariantDto[];

  @ValidateNested()
  @Type(() => CreateProductSeoDto)
  @IsOptional()
  seo?: CreateProductSeoDto;

  @IsArray()
  @IsOptional()
  @IsNumber({}, { each: true })
  frequentlyBoughtTogether?: number[];

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one product image is required' })
  @ValidateNested({ each: true })
  @Type(() => ImageInputDto)
  images!: ImageInputDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeDto)
  attributes?: ProductAttributeDto[];
}

export class UpdateVariantDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsNumber()
  stock?: number;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageInputDto)
  images?: ImageInputDto[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  productVariantOffers?: number[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantAttributeDto)
  variantAttributes?: VariantAttributeDto[];
}

export class UpdateProductSeoDto {
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;

  @IsOptional()
  @IsString()
  metaKeywords?: string;

  @IsOptional()
  @IsString()
  focusKeyword?: string;

  @IsOptional()
  @IsString()
  canonicalUrl?: string;

  @IsOptional()
  @IsString()
  metaRobots?: string;

  @IsOptional()
  @IsString()
  ogTitle?: string;

  @IsOptional()
  @IsString()
  ogDescription?: string;

  @IsOptional()
  @IsString()
  ogImage?: string;

  @IsOptional()
  @IsString()
  twitterCard?: string;

  @IsOptional()
  @IsString()
  twitterTitle?: string;

  @IsOptional()
  @IsString()
  twitterDescription?: string;

  @IsOptional()
  @IsString()
  twitterImage?: string;

  @IsOptional()
  @IsString()
  schemaType?: string;

  @IsOptional()
  @IsString()
  breadcrumbsTitle?: string;

  @IsOptional()
  @IsString()
  primaryKeywordDensity?: string;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  productName?: string;

  @IsOptional()
  @IsString()
  productSlug?: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(PublishStatus)
  publishStatus?: PublishStatus;

  @IsOptional()
  @IsNumber()
  brandId?: number;

  @IsOptional()
  @IsNumber()
  category?: number;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  productOffers?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  productTags?: number[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateVariantDto)
  variants?: UpdateVariantDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateProductSeoDto)
  seo?: UpdateProductSeoDto;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  frequentlyBoughtTogether?: number[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageInputDto)
  images?: ImageInputDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeDto)
  attributes?: ProductAttributeDto[];
}

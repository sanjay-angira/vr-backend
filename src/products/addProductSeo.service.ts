import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from 'src/entities/product/product.entity';
import { ProductSeo } from 'src/entities/product/product-seo.entity';

@Injectable()
export class AddProductSeoService {
  constructor(
    @InjectRepository(ProductSeo)
    private readonly productSeoRepo: Repository<ProductSeo>,
  ) {}

  async addSeo(product: Product, seoDto: any): Promise<ProductSeo> {
    /* ================= FIND EXISTING ================= */
    let seo = await this.productSeoRepo.findOne({
      where: { product: { id: product.id } },
    });

    /* ================= CREATE IF NOT EXISTS ================= */
    if (!seo) {
      seo = this.productSeoRepo.create({
        product: { id: product.id },
      });
    }

    /* ================= ASSIGN VALUES ================= */
    seo.metaTitle = seoDto.metaTitle ?? product.productName;
    seo.metaDescription = seoDto.metaDescription ?? product.description;

    seo.metaKeywords = seoDto.metaKeywords ?? null;
    seo.focusKeyword = seoDto.focusKeyword ?? null;
    seo.canonicalUrl = seoDto.canonicalUrl ?? null;
    seo.metaRobots = seoDto.metaRobots ?? null;

    seo.ogTitle = seoDto.ogTitle ?? null;
    seo.ogDescription = seoDto.ogDescription ?? null;
    seo.ogImage = seoDto.ogImage ?? null;

    seo.twitterCard = seoDto.twitterCard ?? null;
    seo.twitterTitle = seoDto.twitterTitle ?? null;
    seo.twitterDescription = seoDto.twitterDescription ?? null;
    seo.twitterImage = seoDto.twitterImage ?? null;

    seo.schemaType = seoDto.schemaType ?? null;
    seo.breadcrumbsTitle = seoDto.breadcrumbsTitle ?? null;
    seo.primaryKeywordDensity = seoDto.primaryKeywordDensity ?? null;

    /* ================= SAVE ================= */
    return await this.productSeoRepo.save(seo);
  }
}

import { ValidationPipe } from '@nestjs/common';
import { UpdateCategoryDto } from './category.dto';
import { UpdateProductDto } from './product.dto';
import { UpdateBrandDto } from './brand.dto';
import { UpdateBlogDto } from './blog.dto';
import { UpdateCouponDto } from './coupon.dto';

describe('update DTO numeric values', () => {
  const pipe = new ValidationPipe({
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  });

  it('converts category parent and offer IDs from form strings', async () => {
    const result = await pipe.transform(
      { parentId: '2', offerIds: ['3', '4'] },
      { type: 'body', metatype: UpdateCategoryDto },
    );

    expect(result.parentId).toBe(2);
    expect(result.offerIds).toEqual([3, 4]);
  });

  it('converts product and nested variant IDs from form strings', async () => {
    const result = await pipe.transform(
      {
        brandId: '2',
        category: '5',
        productOffers: ['1'],
        productTags: ['3'],
        frequentlyBoughtTogether: ['4'],
        variants: [
          {
            id: '10',
            price: '199',
            stock: '12',
            productVariantOffers: ['12'],
          },
        ],
      },
      { type: 'body', metatype: UpdateProductDto },
    );

    expect(result.brandId).toBe(2);
    expect(result.category).toBe(5);
    expect(result.productOffers).toEqual([1]);
    expect(result.productTags).toEqual([3]);
    expect(result.frequentlyBoughtTogether).toEqual([4]);
    expect(result.variants[0]).toMatchObject({
      id: 10,
      price: 199,
      stock: 12,
      productVariantOffers: [12],
    });
  });

  it('converts brand, blog, and coupon selected IDs from form strings', async () => {
    const brand = await pipe.transform(
      { categoryIds: ['2'], offerIds: ['3'] },
      { type: 'body', metatype: UpdateBrandDto },
    );
    const blog = await pipe.transform(
      { tagIds: ['4'] },
      { type: 'body', metatype: UpdateBlogDto },
    );
    const coupon = await pipe.transform(
      { userIds: ['5'] },
      { type: 'body', metatype: UpdateCouponDto },
    );

    expect(brand.categoryIds).toEqual([2]);
    expect(brand.offerIds).toEqual([3]);
    expect(blog.tagIds).toEqual([4]);
    expect(coupon.userIds).toEqual([5]);
  });
});
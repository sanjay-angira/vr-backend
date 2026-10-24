import { BadRequestException } from '@nestjs/common';
import { groupCartItemsByWarehouse } from './shipping-cart-groups';

describe('groupCartItemsByWarehouse', () => {
  it('builds independent packages by brand and selected pickup warehouse', () => {
    const groups = groupCartItemsByWarehouse([
      {
        variationId: 11,
        quantity: 2,
        productName: 'Product A',
        variant: {
          packageWeightGrams: 300,
          packageHeightCm: 10,
          packageWidthCm: 8,
          packageLengthCm: 12,
          product: { brandId: 4, warehouseId: 21 },
        },
      },
      {
        variationId: 12,
        quantity: 1,
        productName: 'Product B',
        variant: {
          packageWeightGrams: 500,
          packageHeightCm: 5,
          packageWidthCm: 14,
          packageLengthCm: 15,
          product: { brandId: 4, warehouseId: 21 },
        },
      },
      {
        variationId: 13,
        quantity: 1,
        productName: 'Product C',
        variant: {
          packageWeightGrams: 250,
          packageHeightCm: 4,
          packageWidthCm: 6,
          packageLengthCm: 9,
          product: { brandId: 9, warehouseId: 31 },
        },
      },
    ]);

    expect(groups.size).toBe(2);
    expect(groups.get('4:21')).toEqual({
      brandId: 4,
      warehouseId: 21,
      variantIds: [11, 12],
      weightGrams: 1100,
      packageHeightCm: 25,
      packageWidthCm: 14,
      packageLengthCm: 15,
    });
    expect(groups.get('9:31')).toEqual({
      brandId: 9,
      warehouseId: 31,
      variantIds: [13],
      weightGrams: 250,
      packageHeightCm: 4,
      packageWidthCm: 6,
      packageLengthCm: 9,
    });
  });

  it('keeps products with different pickup warehouses in separate packages', () => {
    const groups = groupCartItemsByWarehouse([
      {
        variationId: 11,
        quantity: 1,
        productName: 'Product A',
        variant: {
          packageWeightGrams: 300,
          packageHeightCm: 10,
          packageWidthCm: 8,
          packageLengthCm: 12,
          product: { brandId: 4, warehouseId: 21 },
        },
      },
      {
        variationId: 12,
        quantity: 1,
        productName: 'Product B',
        variant: {
          packageWeightGrams: 500,
          packageHeightCm: 5,
          packageWidthCm: 14,
          packageLengthCm: 15,
          product: { brandId: 4, warehouseId: 22 },
        },
      },
    ]);

    expect(groups.size).toBe(2);
    expect(groups.get('4:21')?.variantIds).toEqual([11]);
    expect(groups.get('4:22')?.variantIds).toEqual([12]);
  });

  it('rejects cart lines without a brand or valid package measurements', () => {
    expect(() =>
      groupCartItemsByWarehouse([
        {
          variationId: 1,
          quantity: 1,
          productName: 'Unbranded',
          variant: null,
        },
      ]),
    ).toThrow(BadRequestException);
  });
});

import { BadRequestException } from '@nestjs/common';

export type ShippingCartLine = {
  variationId: number;
  quantity: number;
  productName: string;
  variant: {
    packageWeightGrams: number;
    packageHeightCm: number;
    packageWidthCm: number;
    packageLengthCm: number;
    product: { brandId: number | null; warehouseId?: number | null } | null;
  } | null;
};

export type ShippingPackageGroup = {
  brandId: number;
  warehouseId: number | null;
  variantIds: number[];
  weightGrams: number;
  packageHeightCm: number;
  packageWidthCm: number;
  packageLengthCm: number;
};

export function groupCartItemsByWarehouse(
  items: ShippingCartLine[],
): Map<string, ShippingPackageGroup> {
  const groups = new Map<string, ShippingPackageGroup>();

  for (const item of items) {
    const brandId = item.variant?.product?.brandId;
    if (!brandId) {
      throw new BadRequestException(
        `A brand is required to resolve the dispatch warehouse for ${item.productName || 'one of the items'}`,
      );
    }
    const quantity = Number(item.quantity);
    const weight = Number(item.variant?.packageWeightGrams);
    const height = Number(item.variant?.packageHeightCm);
    const width = Number(item.variant?.packageWidthCm);
    const length = Number(item.variant?.packageLengthCm);
    if (
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(weight) ||
      weight <= 0 ||
      !Number.isFinite(height) ||
      height <= 0 ||
      !Number.isFinite(width) ||
      width <= 0 ||
      !Number.isFinite(length) ||
      length <= 0
    ) {
      throw new BadRequestException(
        `Package quantity, weight, or dimensions are missing or invalid for ${item.productName || 'one of the items'}`,
      );
    }

    const warehouseId = item.variant?.product?.warehouseId ?? null;
    const key = `${brandId}:${warehouseId ?? 'default'}`;
    const group = groups.get(key) ?? {
      brandId,
      warehouseId,
      variantIds: [],
      weightGrams: 0,
      packageHeightCm: 0,
      packageWidthCm: 0,
      packageLengthCm: 0,
    };
    group.variantIds.push(item.variationId);
    group.weightGrams += weight * quantity;
    group.packageHeightCm += height * quantity;
    group.packageWidthCm = Math.max(group.packageWidthCm, width);
    group.packageLengthCm = Math.max(group.packageLengthCm, length);
    groups.set(key, group);
  }

  return groups;
}

import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

@Injectable()
export class UtilityService {
  formatPrice(value: number | string): string {
    if (typeof value === 'string') return value;
    // ensure 2 decimal places
    return value.toFixed(2);
  }

  generateUuid(): string {
    return randomUUID();
  }

  createSlug(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/[^\w\-]+/g, '') // Remove all non-word chars
      .replace(/\-\-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  buildVariantSlug(
    _productSlug: string | null | undefined,
    variantName: string,
  ): string {
    return this.createSlug(variantName);
  }

  validatePageNumber(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (
      typeof value === 'string' &&
      (value.toLowerCase() === 'null' || value.toLowerCase() === 'undefined')
    )
      return false;
    const changeInNumber = Number(value);
    // Check if value is a number type (not string number), return false
    return !isNaN(changeInNumber);
  }

  validatePageSize(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (
      typeof value === 'string' &&
      (value.toLowerCase() === 'null' || value.toLowerCase() === 'undefined')
    )
      return false;
    const changeInNumber = Number(value);
    // Check if value is a number type (not string number), return false
    return !isNaN(changeInNumber);
  }

  validateSearch(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (
      typeof value === 'string' &&
      (value.toLowerCase() === 'null' || value.toLowerCase() === 'undefined')
    )
      return false;
    return typeof value === 'string' && value.trim().length > 0;
  }
}

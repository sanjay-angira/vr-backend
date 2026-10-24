import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { successResponse } from 'src/commonServices/response.service';
import { ShippingService, type PaymentMode } from './shipping.service';

@Controller('shipping')
export class ShippingController {
  constructor(private readonly shipping: ShippingService) {}

  @Get('serviceability')
  async checkServiceability(
    @Query('pincode') pincode?: string,
    @Query('subtotal') subtotal?: string,
    @Query('weightGrams') weightGrams?: string,
    @Query('packageHeightCm') packageHeightCm?: string,
    @Query('packageWidthCm') packageWidthCm?: string,
    @Query('packageLengthCm') packageLengthCm?: string,
    @Query('variantId') variantId?: string,
    @Query('paymentMode') paymentMode?: string,
  ) {
    const safePaymentMode =
      paymentMode === 'COD' || paymentMode === 'Pre-paid'
        ? paymentMode
        : 'Pre-paid';

    const payload = await this.shipping.checkPincode(pincode ?? '', {
      subtotal: Number(subtotal) || 0,
      weightGrams: Number(weightGrams) || 0,
      packageHeightCm:
        packageHeightCm === undefined ? undefined : Number(packageHeightCm),
      packageWidthCm:
        packageWidthCm === undefined ? undefined : Number(packageWidthCm),
      packageLengthCm:
        packageLengthCm === undefined ? undefined : Number(packageLengthCm),
      productVariantId:
        variantId === undefined ? undefined : Number(variantId),
      paymentMode: safePaymentMode,
    });

    return successResponse(
      payload,
      payload.message || 'Delivery status checked',
    );
  }

  @Get('location')
  async reverseGeocode(
    @Query('lat') latitude?: string,
    @Query('lng') longitude?: string,
  ) {
    const payload = await this.shipping.reverseGeocode(
      latitude ?? '',
      longitude ?? '',
    );

    return successResponse(
      payload,
      payload.message || 'Location lookup completed',
    );
  }

  @Get('estimate')
  async calculateShipping(
    @Query('deliveryPincode') deliveryPincode?: string,
    @Query('weightGrams') weightGrams?: string,
    @Query('packageHeightCm') packageHeightCm?: string,
    @Query('packageWidthCm') packageWidthCm?: string,
    @Query('packageLengthCm') packageLengthCm?: string,
    @Query('variantId') variantId?: string,
    @Query('paymentMode') paymentMode?: string,
  ) {
    if (paymentMode !== 'Pre-paid' && paymentMode !== 'COD') {
      throw new BadRequestException('paymentMode must be Pre-paid or COD');
    }

    const validatedPaymentMode: PaymentMode = paymentMode;
    const payload = await this.shipping.calculateShipping({
      deliveryPincode: deliveryPincode ?? '',
      weightGrams: Number(weightGrams),
      packageHeightCm: Number(packageHeightCm),
      packageWidthCm: Number(packageWidthCm),
      packageLengthCm: Number(packageLengthCm),
      productVariantId:
        variantId === undefined ? undefined : Number(variantId),
      paymentMode: validatedPaymentMode,
    });

    return successResponse(payload, 'Shipping estimate fetched');
  }
}

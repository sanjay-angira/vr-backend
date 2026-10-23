import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ShippingService, type PaymentMode } from './shipping.service';

@Controller('shipping')
export class ShippingController {
  constructor(private readonly shipping: ShippingService) {}

  @Get('serviceability')
  checkServiceability(@Query('pincode') pincode?: string) {
    return this.shipping.checkPincode(pincode ?? '');
  }

  @Get('estimate')
  calculateShipping(
    @Query('deliveryPincode') deliveryPincode?: string,
    @Query('weightGrams') weightGrams?: string,
    @Query('paymentMode') paymentMode?: string,
  ) {
    if (paymentMode !== 'Pre-paid' && paymentMode !== 'COD') {
      throw new BadRequestException('paymentMode must be Pre-paid or COD');
    }

    const validatedPaymentMode: PaymentMode = paymentMode;
    return this.shipping.calculateShipping({
      deliveryPincode: deliveryPincode ?? '',
      weightGrams: Number(weightGrams),
      paymentMode: validatedPaymentMode,
    });
  }
}

import { BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { ShippingService } from './shipping.service';

describe('ShippingService', () => {
  it('checks delivery serviceability for a PIN code', async () => {
    const get = jest.fn().mockReturnValue(
      of({
        data: {
          delivery_codes: [
            {
              postal_code: {
                remarks: null,
                pre_paid: 'Y',
                cash: 'Y',
                city: 'Mathura',
              },
            },
          ],
        },
      }),
    );
    const http = { get } as unknown as HttpService;
    const config = {
      get: jest.fn((key: string) =>
        key === 'DELHIVERY_API_TOKEN' ? 'test-token' : undefined,
      ),
    } as unknown as ConfigService;
    const service = new ShippingService(http, config);

    await expect(service.checkPincode('281001')).resolves.toEqual({
      pincode: '281001',
      serviceable: true,
      prepaidAvailable: true,
      codAvailable: true,
      city: 'Mathura',
      message: 'PIN code checked',
    });
    expect(get).toHaveBeenCalledWith(
      expect.stringContaining('/c/api/pin-codes/json/'),
      expect.objectContaining({
        params: { filter_codes: '281001' },
        timeout: 10000,
      }),
    );
  });

  it('rejects invalid PIN codes before calling the provider', async () => {
    const get = jest.fn();
    const service = new ShippingService(
      { get } as unknown as HttpService,
      { get: jest.fn() } as unknown as ConfigService,
    );

    await expect(service.checkPincode('1234')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(get).not.toHaveBeenCalled();
  });

  it('requests a shipping estimate with the configured warehouse PIN', async () => {
    const get = jest.fn().mockReturnValue(of({ data: [{ total_amount: 45 }] }));
    const http = { get } as unknown as HttpService;
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'DELHIVERY_API_TOKEN') return 'test-token';
        if (key === 'WAREHOUSE_PINCODE') return '281001';
        return undefined;
      }),
    } as unknown as ConfigService;
    const service = new ShippingService(http, config);

    await expect(
      service.calculateShipping({
        deliveryPincode: '110001',
        weightGrams: 500,
        paymentMode: 'COD',
      }),
    ).resolves.toEqual([{ total_amount: 45 }]);
    expect(get).toHaveBeenCalledWith(
      expect.stringContaining('/api/kinko/v1/invoice/charges/.json'),
      expect.objectContaining({
        params: {
          md: 'S',
          ss: 'Delivered',
          d_pin: '110001',
          o_pin: '281001',
          cgm: 500,
          pt: 'COD',
        },
        timeout: 10000,
      }),
    );
  });
});

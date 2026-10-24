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
      shippingFee: 0,
      freeShipping: false,
      prepaidAvailable: true,
      codAvailable: true,
      estimatedDeliveryDate: null,
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

  it('reverse geocodes a location to a PIN code', async () => {
    const get = jest.fn().mockReturnValue(
      of({
        data: {
          status: 'OK',
          results: [
            {
              address_components: [
                { long_name: '281001', types: ['postal_code'] },
              ],
            },
          ],
        },
      }),
    );
    const service = new ShippingService(
      { get } as unknown as HttpService,
      { get: jest.fn((key: string) => (key === 'GOOGLE_MAPS_API_KEY' ? 'test-key' : undefined)) } as unknown as ConfigService,
    );

    await expect(service.reverseGeocode(27.5, 77.7)).resolves.toEqual({
      pincode: '281001',
      city: null,
      message: 'Location matched your current delivery PIN code.',
    });
    expect(get).toHaveBeenCalledWith(
      'https://maps.googleapis.com/maps/api/geocode/json',
      expect.objectContaining({
        params: { latlng: '27.5,77.7', key: 'test-key' },
        timeout: 8000,
      }),
    );
  });

  it('returns a helpful response when Google has no postal code for a location', async () => {
    const get = jest.fn().mockReturnValue(
      of({
        data: {
          status: 'ZERO_RESULTS',
          results: [],
        },
      }),
    );
    const service = new ShippingService(
      { get } as unknown as HttpService,
      { get: jest.fn((key: string) => (key === 'GOOGLE_MAPS_API_KEY' ? 'test-key' : undefined)) } as unknown as ConfigService,
    );

    await expect(service.reverseGeocode(27.5, 77.7)).resolves.toEqual({
      pincode: null,
      city: null,
      message:
        'We could not find a postal code for your current location. Please enter your PIN code manually.',
    });
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
        packageHeightCm: 10,
        packageWidthCm: 15,
        packageLengthCm: 20,
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
          h: 10,
          b: 15,
          l: 20,
          pt: 'COD',
        },
        timeout: 10000,
      }),
    );
  });
});

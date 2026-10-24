import { BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { ShippingService } from './shipping.service';
import { ProductVariant } from 'src/entities/product/product-variants.entity';
import { Warehouse } from 'src/entities/product/warehouse.entity';

function makeShippingService(
  http: HttpService,
  config: ConfigService,
  variantRepository = { findOne: jest.fn() },
  warehouseRepository = { findOne: jest.fn() },
) {
  return new ShippingService(
    http,
    config,
    variantRepository as unknown as import('typeorm').Repository<ProductVariant>,
    warehouseRepository as unknown as import('typeorm').Repository<Warehouse>,
  );
}

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
    const service = makeShippingService(http, config);

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
    const service = makeShippingService(
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
    const service = makeShippingService(
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
    const service = makeShippingService(
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
    const service = makeShippingService(http, config);

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

  it('uses the registered default warehouse PIN for product delivery checks', async () => {
    const get = jest
      .fn()
      .mockReturnValueOnce(
        of({
          data: {
            delivery_codes: [
              { postal_code: { pre_paid: 'Y', cash: 'Y', city: 'Delhi' } },
            ],
          },
        }),
      )
      .mockReturnValueOnce(of({ data: [{ total_amount: 45 }] }));
    const warehouse = {
      id: 17,
      brandId: 4,
      name: 'Primary dispatch',
      pincode: '281001',
      isActive: true,
      isDefault: true,
      registrationStatus: 'REGISTERED',
    };
    const service = makeShippingService(
      { get } as unknown as HttpService,
      {
        get: jest.fn((key: string) => {
          if (key === 'DELHIVERY_API_TOKEN') return 'test-token';
          if (key === 'WAREHOUSE_PINCODE') return '999999';
          return undefined;
        }),
      } as unknown as ConfigService,
      {
        findOne: jest.fn().mockResolvedValue({
          id: 30,
          product: { brand: { id: 4 } },
        }),
      },
      { findOne: jest.fn().mockResolvedValue(warehouse) },
    );

    await expect(
      service.checkPincode('110001', {
        productVariantId: 30,
        subtotal: 250,
        weightGrams: 500,
        packageHeightCm: 10,
        packageWidthCm: 15,
        packageLengthCm: 20,
      }),
    ).resolves.toMatchObject({
      serviceable: true,
      warehouseId: 17,
      warehousePincode: '281001',
      shippingFee: 45,
    });
    expect(get).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/api/kinko/v1/invoice/charges/.json'),
      expect.objectContaining({
        params: expect.objectContaining({
          o_pin: '281001',
          d_pin: '110001',
        }),
      }),
    );
  });

  it('uses the product-assigned pickup warehouse instead of the brand default', async () => {
    const requests: Array<{ params?: Record<string, unknown> }> = [];
    const get = jest.fn(
      (_url: string, options?: { params?: Record<string, unknown> }) => {
        requests.push(options ?? {});
        return requests.length === 1
          ? of({
              data: {
                delivery_codes: [
                  {
                    postal_code: {
                      pre_paid: 'Y',
                      cash: 'Y',
                      city: 'Delhi',
                    },
                  },
                ],
              },
            })
          : of({ data: [{ total_amount: 52 }] });
      },
    );
    const assignedWarehouse = {
      id: 19,
      brandId: 4,
      name: 'North pickup',
      pincode: '110042',
      isActive: true,
      isDefault: false,
      registrationStatus: 'REGISTERED',
    };
    const warehouseRepository = { findOne: jest.fn() };
    const service = makeShippingService(
      { get } as unknown as HttpService,
      {
        get: jest.fn((key: string) => {
          if (key === 'DELHIVERY_API_TOKEN') return 'test-token';
          return undefined;
        }),
      } as unknown as ConfigService,
      {
        findOne: jest.fn().mockResolvedValue({
          id: 30,
          product: {
            brand: { id: 4 },
            warehouseId: 19,
            warehouse: assignedWarehouse,
          },
        }),
      },
      warehouseRepository,
    );

    await expect(
      service.checkPincode('110001', {
        productVariantId: 30,
        subtotal: 250,
        weightGrams: 500,
        packageHeightCm: 10,
        packageWidthCm: 15,
        packageLengthCm: 20,
      }),
    ).resolves.toMatchObject({
      warehouseId: 19,
      warehousePincode: '110042',
      shippingFee: 52,
    });
    expect(warehouseRepository.findOne).not.toHaveBeenCalled();
    expect(requests[1]?.params).toMatchObject({
      o_pin: '110042',
      d_pin: '110001',
    });
  });
});

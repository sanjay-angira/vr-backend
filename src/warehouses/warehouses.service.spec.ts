import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { DataSource, Repository } from 'typeorm';
import { Brand } from 'src/entities/product/brand.entity';
import {
  Warehouse,
  WarehouseRegistrationStatus,
} from 'src/entities/product/warehouse.entity';
import { CreateWarehouseDto } from 'src/dto/warehouse.dto';
import { WarehousesService } from './warehouses.service';

const payload: CreateWarehouseDto = {
  name: 'Kota dispatch',
  contactName: 'Warehouse contact',
  email: 'warehouse@example.com',
  phone: '9999999999',
  addressLine1: '1 Main Road',
  addressLine2: 'Industrial Area',
  city: 'Kota',
  state: 'Rajasthan',
  country: 'India',
  pincode: '110042',
  registeredName: 'VRINDAVAN RASA B2C',
  returnAddress: '2 Return Road',
  returnPin: '110042',
  returnCity: 'Delhi',
  returnState: 'Delhi',
  returnCountry: 'India',
};

function makeService(options?: {
  providerResponse?: unknown;
  providerError?: unknown;
  duplicate?: Warehouse | null;
}) {
  const warehouseRepository = {
    create: jest.fn((data) => data),
    findOne: jest.fn().mockResolvedValue(options?.duplicate ?? null),
    save: jest.fn(async (warehouse) =>
      Object.assign(warehouse, { id: (warehouse as Warehouse).id ?? 7 }),
    ),
    find: jest.fn(),
  };
  const brandRepository = {
    findOne: jest.fn().mockResolvedValue({ id: 4, brandName: 'Test brand' }),
    existsBy: jest.fn().mockResolvedValue(true),
  };
  const http = {
    post: jest.fn(() =>
      options?.providerError
        ? throwError(() => options.providerError)
        : of({
            data: options?.providerResponse ?? {
              success: true,
              error: '',
              data: {
                message:
                  'A new client warehouse has been created in HQ(Delhivery).',
                name: 'Kota dispatch',
              },
            },
          }),
    ),
  };
  const config = {
    get: jest.fn((key: string) =>
      key === 'DELHIVERY_API_TOKEN'
        ? 'test-token'
        : key === 'DELHIVERY_WAREHOUSE_CREATE_URL'
          ? 'https://track.delhivery.com/api/backend/clientwarehouse/create/'
          : undefined,
    ),
  };
  const service = new WarehousesService(
    warehouseRepository as unknown as Repository<Warehouse>,
    brandRepository as unknown as Repository<Brand>,
    http as unknown as HttpService,
    config as unknown as ConfigService,
    {} as DataSource,
  );
  return { service, warehouseRepository, http };
}

describe('WarehousesService', () => {
  it('registers a warehouse only after the documented success response', async () => {
    const { service, warehouseRepository, http } = makeService();

    const result = await service.create(4, payload);

    expect(result.success).toBe(true);
    expect(result.data.registrationStatus).toBe(
      WarehouseRegistrationStatus.REGISTERED,
    );
    expect(result.data.delhiveryWarehouseName).toBe('Kota dispatch');
    expect(result.data.delhiveryWarehouseId).toBeNull();
    expect(http.post).toHaveBeenCalledWith(
      'https://track.delhivery.com/api/backend/clientwarehouse/create/',
      {
        phone: payload.phone,
        city: payload.city,
        name: payload.name,
        pin: payload.pincode,
        address: '1 Main Road, Industrial Area',
        country: payload.country,
        email: payload.email,
        registered_name: payload.registeredName,
        return_address: payload.returnAddress,
        return_pin: payload.returnPin,
        return_city: payload.returnCity,
        return_state: payload.returnState,
        return_country: payload.returnCountry,
      },
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Token test-token',
          'Content-Type': 'application/json',
        }),
        timeout: 12000,
      }),
    );
    expect(warehouseRepository.save).toHaveBeenCalledTimes(2);
  });

  it('rejects duplicate warehouse registration before calling Delhivery', async () => {
    const existing = {
      id: 9,
      registrationStatus: WarehouseRegistrationStatus.REGISTERED,
    } as Warehouse;
    const { service, http } = makeService({ duplicate: existing });

    await expect(service.create(4, payload)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(http.post).not.toHaveBeenCalled();
  });

  it('records provider rejection as failed and does not mark it registered', async () => {
    const { service, warehouseRepository } = makeService({
      providerResponse: {
        success: false,
        error: 'Invalid PIN',
        data: { message: 'Invalid PIN' },
      },
    });

    await expect(service.create(4, payload)).rejects.toBeInstanceOf(
      BadGatewayException,
    );
    expect(warehouseRepository.save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        registrationStatus: WarehouseRegistrationStatus.FAILED,
      }),
    );
  });

  it('marks a timeout outcome for reconciliation instead of retrying automatically', async () => {
    const timeout = Object.assign(new Error('timeout'), {
      isAxiosError: true,
      code: 'ECONNABORTED',
    });
    const { service, warehouseRepository } = makeService({
      providerError: timeout,
    });

    await expect(service.create(4, payload)).rejects.toThrow(
      /outcome is uncertain/,
    );
    expect(warehouseRepository.save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        registrationStatus: WarehouseRegistrationStatus.RECONCILIATION_REQUIRED,
      }),
    );
  });

  it('does not report success if persistence fails after provider registration', async () => {
    const warehouseRepository = {
      create: jest.fn((data) => data),
      findOne: jest.fn().mockResolvedValue(null),
      save: jest
        .fn()
        .mockImplementationOnce(async (warehouse) =>
          Object.assign(warehouse, { id: 11 }),
        )
        .mockRejectedValueOnce(new Error('database unavailable'))
        .mockImplementationOnce(async (warehouse) => warehouse),
    };
    const service = new WarehousesService(
      warehouseRepository as unknown as Repository<Warehouse>,
      {
        findOne: jest.fn().mockResolvedValue({ id: 4 }),
      } as unknown as Repository<Brand>,
      {
        post: jest.fn(() =>
          of({
            data: {
              success: true,
              data: { name: 'Kota dispatch' },
            },
          }),
        ),
      } as unknown as HttpService,
      {
        get: jest.fn((key: string) =>
          key === 'DELHIVERY_API_TOKEN' ? 'test-token' : undefined,
        ),
      } as unknown as ConfigService,
      {} as DataSource,
    );

    await expect(service.create(4, payload)).rejects.toThrow(
      /local persistence failed/,
    );
    expect(warehouseRepository.save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        registrationStatus: WarehouseRegistrationStatus.RECONCILIATION_REQUIRED,
      }),
    );
  });

  it('does not allow changing provider-managed address fields after registration', async () => {
    const registeredWarehouse = {
      id: 8,
      brandId: 4,
      name: 'Registered location',
      pincode: '110042',
      registrationStatus: WarehouseRegistrationStatus.REGISTERED,
      addressLine1: 'Original address',
    } as Warehouse;
    const { service, http } = makeService({ duplicate: registeredWarehouse });
    const warehouseRepository = (
      service as unknown as {
        warehouseRepository: Repository<Warehouse>;
      }
    ).warehouseRepository;
    jest
      .spyOn(warehouseRepository, 'findOne')
      .mockResolvedValue(registeredWarehouse);

    await expect(
      service.update(8, { addressLine1: 'Replacement address' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(http.post).not.toHaveBeenCalled();
  });

  it('makes only an active registered warehouse the brand default transactionally', async () => {
    const registeredWarehouse = {
      id: 8,
      brandId: 4,
      registrationStatus: WarehouseRegistrationStatus.REGISTERED,
      isActive: true,
      isDefault: false,
    } as Warehouse;
    const queryBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    };
    const manager = {
      createQueryBuilder: jest.fn(() => queryBuilder),
      save: jest.fn(async (_entity, value) => value),
    };
    const service = new WarehousesService(
      {
        findOne: jest.fn().mockResolvedValue(registeredWarehouse),
      } as unknown as Repository<Warehouse>,
      {} as Repository<Brand>,
      {} as HttpService,
      {} as ConfigService,
      {
        transaction: jest.fn(async (callback) => callback(manager)),
      } as unknown as DataSource,
    );

    const result = await service.setDefault(8);

    expect(result.data.isDefault).toBe(true);
    expect(queryBuilder.where).toHaveBeenCalledWith('"brandId" = :brandId', {
      brandId: 4,
    });
    expect(manager.save).toHaveBeenCalledWith(Warehouse, registeredWarehouse);
  });

  it('rejects inactive or unregistered warehouses as the default', async () => {
    const inactiveWarehouse = {
      id: 8,
      brandId: 4,
      registrationStatus: WarehouseRegistrationStatus.REGISTERED,
      isActive: false,
      isDefault: false,
    } as Warehouse;
    const service = new WarehousesService(
      {
        findOne: jest.fn().mockResolvedValue(inactiveWarehouse),
      } as unknown as Repository<Warehouse>,
      {} as Repository<Brand>,
      {} as HttpService,
      {} as ConfigService,
      {} as DataSource,
    );

    await expect(service.setDefault(8)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

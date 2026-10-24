import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { firstValueFrom } from 'rxjs';
import { DataSource, Repository } from 'typeorm';
import { Brand } from 'src/entities/product/brand.entity';
import {
  Warehouse,
  WarehouseRegistrationStatus,
} from 'src/entities/product/warehouse.entity';
import { CreateWarehouseDto, UpdateWarehouseDto } from 'src/dto/warehouse.dto';
import { successResponse } from 'src/commonServices/response.service';

type DelhiveryCreateResponse = {
  success?: boolean;
  error?: string;
  data?: {
    message?: string;
    name?: string;
  };
};

const providerManagedFields = [
  'name',
  'email',
  'phone',
  'addressLine1',
  'addressLine2',
  'city',
  'state',
  'country',
  'pincode',
  'registeredName',
  'returnAddress',
  'returnPin',
  'returnCity',
  'returnState',
  'returnCountry',
] as const;

@Injectable()
export class WarehousesService {
  private readonly logger = new Logger(WarehousesService.name);

  constructor(
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async create(brandId: number, dto: CreateWarehouseDto) {
    const brand = await this.brandRepository.findOne({
      where: { id: brandId },
    });
    if (!brand) throw new NotFoundException('Brand not found');

    const duplicate = await this.warehouseRepository.findOne({
      where: [
        { brandId, name: dto.name, pincode: dto.pincode },
        { brandId, registeredName: dto.registeredName, pincode: dto.pincode },
      ],
    });
    if (duplicate) {
      throw new ConflictException(
        'A warehouse with this name and PIN code already exists for the brand',
      );
    }

    const warehouse = this.warehouseRepository.create({
      ...dto,
      brandId,
      addressLine2: dto.addressLine2 || null,
      registrationStatus: WarehouseRegistrationStatus.PENDING,
      registrationError: null,
      registeredAt: null,
      delhiveryWarehouseName: null,
      delhiveryWarehouseId: null,
      isDefault: false,
      isActive: dto.isActive === false ? false : true,
    });
    let savedPending: Warehouse;
    try {
      savedPending = await this.warehouseRepository.save(warehouse);
    } catch (error) {
      const driverError =
        error && typeof error === 'object' && 'driverError' in error
          ? (error as { driverError?: unknown }).driverError
          : null;
      const databaseCode =
        driverError && typeof driverError === 'object' && 'code' in driverError
          ? (driverError as { code?: unknown }).code
          : null;
      if (databaseCode === '23505') {
        throw new ConflictException(
          'A warehouse with this name and PIN code already exists for the brand',
        );
      }
      throw error;
    }

    let response: DelhiveryCreateResponse;
    try {
      response = await this.createDelhiveryWarehouse(savedPending);
    } catch (error) {
      const ambiguous =
        axios.isAxiosError(error) &&
        (!error.response || error.response.status >= 500);
      savedPending.registrationStatus = ambiguous
        ? WarehouseRegistrationStatus.RECONCILIATION_REQUIRED
        : WarehouseRegistrationStatus.FAILED;
      savedPending.registrationError = this.safeProviderMessage(error);
      await this.warehouseRepository.save(savedPending);
      if (ambiguous) {
        throw new ServiceUnavailableException(
          `Warehouse registration outcome is uncertain. Reconcile it in Delhivery before retrying (local warehouse ${savedPending.id}).`,
        );
      }
      throw new BadGatewayException(savedPending.registrationError);
    }

    if (response.success !== true || !response.data?.name) {
      savedPending.registrationStatus =
        response.success === false
          ? WarehouseRegistrationStatus.FAILED
          : WarehouseRegistrationStatus.RECONCILIATION_REQUIRED;
      savedPending.registrationError = this.sanitizeMessage(
        response.error ||
          response.data?.message ||
          'Delhivery rejected the warehouse',
      );
      await this.warehouseRepository.save(savedPending);
      throw new BadGatewayException(savedPending.registrationError);
    }

    savedPending.registrationStatus = WarehouseRegistrationStatus.REGISTERED;
    savedPending.registrationError = null;
    savedPending.delhiveryWarehouseName = response.data.name;
    savedPending.registeredAt = new Date();
    let registered: Warehouse;
    try {
      registered = await this.warehouseRepository.save(savedPending);
    } catch {
      savedPending.registrationStatus =
        WarehouseRegistrationStatus.RECONCILIATION_REQUIRED;
      savedPending.registrationError = `Delhivery reported warehouse "${response.data.name}" as created, but the local record could not be finalized. Reconcile before retrying.`;
      try {
        await this.warehouseRepository.save(savedPending);
      } catch {
        this.logger.error(
          `Could not persist reconciliation state for warehouse ${savedPending.id}`,
        );
      }
      throw new ServiceUnavailableException(
        `Delhivery reported "${response.data.name}" as created, but local persistence failed. Reconcile local warehouse ${savedPending.id} before retrying.`,
      );
    }
    if (dto.isDefault === true && registered.isActive) {
      return this.setDefault(registered.id);
    }
    return successResponse(
      registered,
      'Warehouse registered successfully',
      201,
    );
  }

  async findByBrand(brandId: number) {
    const brandExists = await this.brandRepository.existsBy({ id: brandId });
    if (!brandExists) throw new NotFoundException('Brand not found');
    const warehouses = await this.warehouseRepository.find({
      where: { brandId },
      order: { createdAt: 'DESC' },
    });
    return successResponse(warehouses, 'Warehouses retrieved successfully');
  }

  async findOne(id: number) {
    const warehouse = await this.getWarehouse(id);
    return successResponse(warehouse, 'Warehouse retrieved successfully');
  }

  async update(id: number, dto: UpdateWarehouseDto) {
    const warehouse = await this.getWarehouse(id);
    if (warehouse.registrationStatus === WarehouseRegistrationStatus.PENDING) {
      throw new ConflictException(
        'Warehouse registration is in progress; wait for it to complete before editing',
      );
    }
    if (
      warehouse.registrationStatus === WarehouseRegistrationStatus.REGISTERED
    ) {
      const changesExternalAddress = providerManagedFields.some((field) => {
        const nextValue = dto[field];
        return nextValue !== undefined && nextValue !== warehouse[field];
      });
      if (changesExternalAddress) {
        throw new BadRequestException(
          'Delhivery does not have a verified update endpoint configured. Address and registration fields are locked; create and register a replacement warehouse instead.',
        );
      }
    }

    if (
      dto.isDefault === true &&
      (warehouse.registrationStatus !==
        WarehouseRegistrationStatus.REGISTERED ||
        !warehouse.isActive)
    ) {
      throw new BadRequestException(
        'Only active, registered warehouses can be the brand default',
      );
    }
    const { isDefault, ...updateFields } = dto;
    Object.assign(warehouse, updateFields);
    if (isDefault === false) warehouse.isDefault = false;
    const saved = await this.warehouseRepository.save(warehouse);
    if (isDefault === true && saved.isActive) return this.setDefault(saved.id);
    return successResponse(saved, 'Warehouse updated successfully');
  }

  async setDefault(id: number) {
    const warehouse = await this.getWarehouse(id);
    if (
      warehouse.registrationStatus !== WarehouseRegistrationStatus.REGISTERED ||
      !warehouse.isActive
    ) {
      throw new BadRequestException(
        'Only active, registered warehouses can be the brand default',
      );
    }

    const saved = await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .update(Warehouse)
        .set({ isDefault: false })
        .where('"brandId" = :brandId', { brandId: warehouse.brandId })
        .execute();
      warehouse.isDefault = true;
      return manager.save(Warehouse, warehouse);
    });
    return successResponse(saved, 'Default warehouse updated successfully');
  }

  async setStatus(id: number, isActive: boolean) {
    const warehouse = await this.getWarehouse(id);
    if (
      warehouse.registrationStatus !== WarehouseRegistrationStatus.REGISTERED
    ) {
      throw new BadRequestException(
        'Only registered warehouses can be activated or deactivated',
      );
    }
    warehouse.isActive = isActive;
    if (!isActive) warehouse.isDefault = false;
    const saved = await this.warehouseRepository.save(warehouse);
    return successResponse(saved, 'Warehouse status updated successfully');
  }

  async retryRegistration(id: number) {
    const warehouse = await this.getWarehouse(id);
    if (
      warehouse.registrationStatus === WarehouseRegistrationStatus.REGISTERED
    ) {
      throw new ConflictException('Warehouse is already registered');
    }
    if (
      warehouse.registrationStatus ===
      WarehouseRegistrationStatus.RECONCILIATION_REQUIRED
    ) {
      throw new ConflictException(
        'Registration outcome is uncertain. Check Delhivery manually and reconcile before retrying to avoid creating a duplicate.',
      );
    }
    if (warehouse.registrationStatus !== WarehouseRegistrationStatus.FAILED) {
      throw new ConflictException(
        'Only a confirmed failed registration can be retried',
      );
    }

    warehouse.registrationStatus = WarehouseRegistrationStatus.PENDING;
    warehouse.registrationError = null;
    await this.warehouseRepository.save(warehouse);
    let response: DelhiveryCreateResponse;
    try {
      response = await this.createDelhiveryWarehouse(warehouse);
    } catch (error) {
      const ambiguous =
        axios.isAxiosError(error) &&
        (!error.response || error.response.status >= 500);
      warehouse.registrationStatus = ambiguous
        ? WarehouseRegistrationStatus.RECONCILIATION_REQUIRED
        : WarehouseRegistrationStatus.FAILED;
      warehouse.registrationError = this.safeProviderMessage(error);
      await this.warehouseRepository.save(warehouse);
      if (ambiguous) {
        throw new ServiceUnavailableException(
          'Registration outcome is uncertain. Reconcile the warehouse in Delhivery before retrying.',
        );
      }
      throw new BadGatewayException(warehouse.registrationError);
    }
    if (response.success !== true || !response.data?.name) {
      warehouse.registrationStatus =
        response.success === false
          ? WarehouseRegistrationStatus.FAILED
          : WarehouseRegistrationStatus.RECONCILIATION_REQUIRED;
      warehouse.registrationError = this.sanitizeMessage(
        response.error ||
          response.data?.message ||
          'Delhivery response was inconclusive',
      );
      await this.warehouseRepository.save(warehouse);
      throw new BadGatewayException(warehouse.registrationError);
    }
    warehouse.registrationStatus = WarehouseRegistrationStatus.REGISTERED;
    warehouse.delhiveryWarehouseName = response.data.name;
    warehouse.registeredAt = new Date();
    warehouse.registrationError = null;
    let saved: Warehouse;
    try {
      saved = await this.warehouseRepository.save(warehouse);
    } catch {
      warehouse.registrationStatus =
        WarehouseRegistrationStatus.RECONCILIATION_REQUIRED;
      warehouse.registrationError = `Delhivery reported warehouse "${response.data.name}" as created, but local persistence failed. Reconcile before retrying.`;
      try {
        await this.warehouseRepository.save(warehouse);
      } catch {
        this.logger.error(
          `Could not persist reconciliation state for warehouse ${warehouse.id}`,
        );
      }
      throw new ServiceUnavailableException(
        `Delhivery reported "${response.data.name}" as created, but local persistence failed. Reconcile warehouse ${warehouse.id} before retrying.`,
      );
    }
    return successResponse(saved, 'Warehouse registered successfully');
  }

  private async getWarehouse(id: number): Promise<Warehouse> {
    const warehouse = await this.warehouseRepository.findOne({ where: { id } });
    if (!warehouse) throw new NotFoundException('Warehouse not found');
    return warehouse;
  }

  private async createDelhiveryWarehouse(
    warehouse: Warehouse,
  ): Promise<DelhiveryCreateResponse> {
    const token = this.config.get<string>('DELHIVERY_API_TOKEN');
    if (!token) {
      throw new ServiceUnavailableException(
        'Delhivery API token is not configured',
      );
    }
    const endpoint =
      this.config.get<string>('DELHIVERY_WAREHOUSE_CREATE_URL') ??
      `${(
        this.config.get<string>('DELHIVERY_BASE_URL') ??
        'https://staging-express.delhivery.com'
      ).replace(/\/+$/, '')}/api/backend/clientwarehouse/create/`;
    const payload = {
      phone: warehouse.phone,
      city: warehouse.city,
      name: warehouse.name,
      pin: warehouse.pincode,
      address: [warehouse.addressLine1, warehouse.addressLine2]
        .filter(Boolean)
        .join(', '),
      country: warehouse.country,
      email: warehouse.email,
      registered_name: warehouse.registeredName,
      return_address: warehouse.returnAddress,
      return_pin: warehouse.returnPin,
      return_city: warehouse.returnCity,
      return_state: warehouse.returnState,
      return_country: warehouse.returnCountry,
    };
    try {
      return await this.sendDelhiveryRequest(endpoint, payload, token);
    } catch (error) {
      this.logger.error(
        `Delhivery warehouse registration failed for local warehouse ${warehouse.id}: ${this.sanitizeMessage(
          error instanceof Error ? error.message : String(error),
        )}`,
      );
      throw error;
    }
  }

  private async sendDelhiveryRequest(
    endpoint: string,
    payload: Record<string, unknown>,
    token: string,
  ): Promise<DelhiveryCreateResponse> {
    try {
      const { data } = await firstValueFrom(
        this.http.post<DelhiveryCreateResponse>(endpoint, payload, {
          headers: {
            Authorization: `Token ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          timeout: 12000,
        }),
      );
      return data;
      
    } catch (error) {
      throw new BadGatewayException(`Delhivery request failed: ${this.safeProviderMessage(
          error,
        )}`,
      );
    }
  }

  private safeProviderMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      if (error.response?.status) {
        return `Delhivery request failed with status ${error.response.status}`;
      }
      return 'Delhivery request outcome is uncertain due to a network or timeout error';
    }
    if (error instanceof ServiceUnavailableException) return error.message;
    return 'Delhivery warehouse registration failed';
  }

  private sanitizeMessage(message: string): string {
    return String(message)
      .replace(/token\s+\S+/gi, 'Token [redacted]')
      .replace(/[\r\n\t]/g, ' ')
      .slice(0, 500);
  }
}

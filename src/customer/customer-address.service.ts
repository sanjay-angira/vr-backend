import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  successResponse,
  errorResponse,
} from 'src/commonServices/response.service';
import { UserAddress } from 'src/entities/user/userAddress.entity';
import { User } from 'src/entities/user/user.entity';
import {
  CreateUserAddressDto,
  UpdateUserAddressDto,
} from 'src/dto/user-address.dto';

@Injectable()
export class CustomerAddressService {
  constructor(
    @InjectRepository(UserAddress)
    private readonly addressRepository: Repository<UserAddress>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  private mapAddress(address: UserAddress) {
    return {
      id: address.id,
      userId: address.userId,
      label: address.label,
      fullName: address.fullName,
      phone: address.phone,
      email: address.email,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      isDefault: address.isDefault,
      createdAt: address.createdAt,
      updatedAt: address.updatedAt,
    };
  }

  private async clearOtherDefaults(userId: number, keepId?: number) {
    const addresses = await this.addressRepository.find({ where: { userId } });
    for (const row of addresses) {
      if (keepId && row.id === keepId) continue;
      if (!row.isDefault) continue;
      row.isDefault = false;
      await this.addressRepository.save(row);
    }
  }

  async listAddresses(userId: number) {
    if (!userId || Number.isNaN(userId)) {
      return errorResponse('userId is required', 400);
    }

    const addresses = await this.addressRepository.find({
      where: { userId },
      order: { isDefault: 'DESC', updatedAt: 'DESC' },
    });

    return successResponse(
      addresses.map((row) => this.mapAddress(row)),
      'Addresses fetched successfully',
    );
  }

  async createAddress(dto: CreateUserAddressDto) {
    const user = await this.usersRepository.findOne({
      where: { id: dto.userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingCount = await this.addressRepository.count({
      where: { userId: dto.userId },
    });
    const makeDefault = dto.isDefault === true || existingCount === 0;

    if (makeDefault) {
      await this.clearOtherDefaults(dto.userId);
    }

    const address = this.addressRepository.create({
      userId: dto.userId,
      label: dto.label?.trim() || null,
      fullName: dto.fullName.trim(),
      phone: dto.phone.trim(),
      email: dto.email?.trim().toLowerCase() || null,
      addressLine1: dto.addressLine1.trim(),
      addressLine2: dto.addressLine2?.trim() || null,
      city: dto.city.trim(),
      state: dto.state.trim(),
      pincode: dto.pincode.trim(),
      isDefault: makeDefault,
    });

    const saved = await this.addressRepository.save(address);
    return successResponse(
      this.mapAddress(saved),
      'Address created successfully',
    );
  }

  async updateAddress(id: number, dto: UpdateUserAddressDto) {
    const address = await this.addressRepository.findOne({
      where: { id, userId: dto.userId },
    });
    if (!address) {
      throw new NotFoundException('Address not found');
    }

    if (dto.label !== undefined) address.label = dto.label?.trim() || null;
    if (dto.fullName !== undefined) address.fullName = dto.fullName.trim();
    if (dto.phone !== undefined) address.phone = dto.phone.trim();
    if (dto.email !== undefined) {
      address.email = dto.email?.trim().toLowerCase() || null;
    }
    if (dto.addressLine1 !== undefined) {
      address.addressLine1 = dto.addressLine1.trim();
    }
    if (dto.addressLine2 !== undefined) {
      address.addressLine2 = dto.addressLine2?.trim() || null;
    }
    if (dto.city !== undefined) address.city = dto.city.trim();
    if (dto.state !== undefined) address.state = dto.state.trim();
    if (dto.pincode !== undefined) address.pincode = dto.pincode.trim();

    if (dto.isDefault === true) {
      await this.clearOtherDefaults(dto.userId, address.id);
      address.isDefault = true;
    } else if (dto.isDefault === false) {
      address.isDefault = false;
    }

    const saved = await this.addressRepository.save(address);
    return successResponse(
      this.mapAddress(saved),
      'Address updated successfully',
    );
  }

  async deleteAddress(id: number, userId: number) {
    if (!userId || Number.isNaN(userId)) {
      return errorResponse('userId is required', 400);
    }

    const address = await this.addressRepository.findOne({
      where: { id, userId },
    });
    if (!address) {
      throw new NotFoundException('Address not found');
    }

    const wasDefault = address.isDefault;
    await this.addressRepository.remove(address);

    if (wasDefault) {
      const next = await this.addressRepository.findOne({
        where: { userId },
        order: { updatedAt: 'DESC' },
      });
      if (next) {
        next.isDefault = true;
        await this.addressRepository.save(next);
      }
    }

    return successResponse(null, 'Address deleted successfully');
  }

  async setDefaultAddress(id: number, userId: number) {
    if (!userId || Number.isNaN(userId)) {
      throw new BadRequestException('userId is required');
    }

    const address = await this.addressRepository.findOne({
      where: { id, userId },
    });
    if (!address) {
      throw new NotFoundException('Address not found');
    }

    await this.clearOtherDefaults(userId, address.id);
    address.isDefault = true;
    const saved = await this.addressRepository.save(address);

    return successResponse(
      this.mapAddress(saved),
      'Default address updated successfully',
    );
  }

  async getAddressForUser(id: number, userId: number) {
    return this.addressRepository.findOne({ where: { id, userId } });
  }
}

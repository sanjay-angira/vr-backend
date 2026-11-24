import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon } from '../entities/user/coupon.entity';
import { User } from '../entities/user/user.entity';
import { CreateCouponDto } from '../dto/coupon.dto';
import {
  successResponse,
  errorResponse,
} from 'src/commonServices/response.service';
import { IdDto, PaginationDto } from '../dto/common.dto';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private isWithinValidity(coupon: Coupon): boolean {
    if (!coupon.timeBased) return true;
    if (!coupon.startDate || !coupon.endDate) return false;

    const now = Date.now();
    return (
      now >= new Date(coupon.startDate).getTime() &&
      now <= new Date(coupon.endDate).getTime()
    );
  }

  /** Keeps unique indexes free after soft-delete without touching order snapshots. */
  private archiveUniqueValue(value: string, id: number): string {
    const suffix = `__del__${id}`;
    const maxBase = Math.max(1, 50 - suffix.length);
    return `${String(value || 'coupon').slice(0, maxBase)}${suffix}`;
  }

  async create(createCouponDto: CreateCouponDto) {
    try {
      const existingCoupon = await this.couponRepository.findOne({
        where: { couponCode: createCouponDto.couponCode, isDeleted: false },
      });

      if (existingCoupon) {
        return errorResponse('Coupon code already exists', 400);
      }

      const coupon = new Coupon();
      coupon.couponCode = createCouponDto.couponCode;
      coupon.image = createCouponDto.image?.trim() || null;
      coupon.discountType = createCouponDto.discountType;
      coupon.discountValue = createCouponDto.discountValue;
      coupon.timeBased = createCouponDto.timeBased ?? true;
      coupon.startDate = coupon.timeBased
        ? new Date(createCouponDto.startDate!)
        : null;
      coupon.endDate = coupon.timeBased
        ? new Date(createCouponDto.endDate!)
        : null;
      coupon.isActive = createCouponDto.isActive ?? true;
      coupon.isUserSpecific = createCouponDto.isUserSpecific ?? false;
      coupon.isDeleted = false;

      if (
        coupon.isUserSpecific &&
        createCouponDto.userIds &&
        createCouponDto.userIds.length > 0
      ) {
        const users = await this.userRepository.findByIds(
          createCouponDto.userIds,
        );
        if (users.length !== createCouponDto.userIds.length) {
          return errorResponse('One or more users not found', 404);
        }
        coupon.users = users;
      }

      const savedCoupon = await this.couponRepository.save(coupon);
      return successResponse(savedCoupon, 'Coupon created successfully', 201);
    } catch (error) {
      throw error;
    }
  }

  async findAll(paginationDto: PaginationDto) {
    try {
      const { pageNumber, pageSize, search, column, order } = paginationDto;
      const queryBuilder = this.couponRepository
        .createQueryBuilder('coupon')
        .where('coupon.isDeleted = :isDeleted', { isDeleted: false });

      if (search && search.trim() !== '' && search !== 'null') {
        queryBuilder.andWhere('coupon.couponCode ILIKE :search', {
          search: `%${search}%`,
        });
      }

      if (column && order) {
        const allowedColumns = [
          'id',
          'couponCode',
          'discountType',
          'discountValue',
          'startDate',
          'endDate',
          'isActive',
          'isUserSpecific',
          'createdAt',
        ];
        const columnName = column.trim();
        const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        if (allowedColumns.includes(columnName)) {
          queryBuilder.orderBy(`coupon.${columnName}`, sortOrder);
        } else {
          queryBuilder.orderBy('coupon.id', 'ASC');
        }
      } else {
        queryBuilder.orderBy('coupon.id', 'ASC');
      }

      if (pageNumber && pageSize) {
        const page_number = Number(pageNumber);
        const page_size = Number(pageSize);
        queryBuilder.skip((page_number - 1) * page_size).take(page_size);
      }

      const [rows, count] = await queryBuilder.getManyAndCount();
      return successResponse({ rows, count }, 'Coupons retrieved successfully');
    } catch (error) {
      throw error;
    }
  }

  async findPublic(paginationDto: PaginationDto) {
    const pageNumber = Math.max(1, Number(paginationDto.pageNumber) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(paginationDto.pageSize) || 50));
    const [rows, count] = await this.couponRepository
      .createQueryBuilder('coupon')
      .select([
        'coupon.id',
        'coupon.couponCode',
        'coupon.image',
        'coupon.discountType',
        'coupon.discountValue',
        'coupon.startDate',
        'coupon.endDate',
        'coupon.timeBased',
      ])
      .where('coupon.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('coupon.isActive = :isActive', { isActive: true })
      .andWhere('coupon.isUserSpecific = :isUserSpecific', {
        isUserSpecific: false,
      })
      .andWhere(
        '(coupon.timeBased = :timeBased OR (coupon.startDate <= CURRENT_TIMESTAMP AND coupon.endDate >= CURRENT_TIMESTAMP))',
        { timeBased: false },
      )
      .orderBy('coupon.discountValue', 'DESC')
      .skip((pageNumber - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return successResponse({ rows, count }, 'Public coupons retrieved successfully');
  }

  async findOne(idDto: IdDto) {
    try {
      const id = Number(idDto.id);
      const coupon = await this.couponRepository.findOne({
        where: { id, isDeleted: false },
        relations: ['users'],
      });

      if (!coupon) {
        throw new NotFoundException('Coupon not found');
      }

      return successResponse(coupon, 'Coupon retrieved successfully');
    } catch (error) {
      throw error;
    }
  }

  async findByCode(couponCode: string) {
    try {
      const coupon = await this.couponRepository.findOne({
        where: { couponCode, isDeleted: false },
        relations: ['users'],
      });

      if (!coupon) {
        throw new NotFoundException('Coupon not found');
      }

      if (!coupon.isActive) {
        return errorResponse('Coupon is not active', 400);
      }

      if (!this.isWithinValidity(coupon)) {
        return errorResponse('Coupon is not valid', 400);
      }

      return successResponse(coupon, 'Coupon retrieved successfully');
    } catch (error) {
      throw error;
    }
  }

  async update(id: number, updateCouponDto: Partial<CreateCouponDto>) {
    try {
      const coupon = await this.couponRepository.findOne({
        where: { id, isDeleted: false },
        relations: ['users'],
      });

      if (!coupon) {
        throw new NotFoundException('Coupon not found');
      }

      if (updateCouponDto.couponCode !== undefined) {
        const existingCoupon = await this.couponRepository.findOne({
          where: {
            couponCode: updateCouponDto.couponCode,
            isDeleted: false,
          },
        });

        if (existingCoupon && existingCoupon.id !== id) {
          return errorResponse('Coupon code already exists', 400);
        }
        coupon.couponCode = updateCouponDto.couponCode;
      }

      if (updateCouponDto.image !== undefined) {
        coupon.image = updateCouponDto.image?.trim() || null;
      }

      if (updateCouponDto.discountType !== undefined) {
        coupon.discountType = updateCouponDto.discountType;
      }

      if (updateCouponDto.discountValue !== undefined) {
        coupon.discountValue = updateCouponDto.discountValue;
      }

      const timeBased = updateCouponDto.timeBased ?? coupon.timeBased;
      coupon.timeBased = timeBased;
      if (timeBased) {
        const startDate =
          updateCouponDto.startDate !== undefined
            ? new Date(updateCouponDto.startDate)
            : coupon.startDate;
        const endDate =
          updateCouponDto.endDate !== undefined
            ? new Date(updateCouponDto.endDate)
            : coupon.endDate;
        if (!startDate || !endDate) {
          return errorResponse(
            'Please provide start and end dates for a time-based coupon',
            400,
          );
        }
        coupon.startDate = startDate;
        coupon.endDate = endDate;
      } else {
        coupon.startDate = null;
        coupon.endDate = null;
      }

      if (updateCouponDto.isActive !== undefined) {
        coupon.isActive = updateCouponDto.isActive;
      }

      if (updateCouponDto.isUserSpecific !== undefined) {
        coupon.isUserSpecific = updateCouponDto.isUserSpecific;
      }

      if (
        updateCouponDto.isUserSpecific &&
        updateCouponDto.userIds &&
        updateCouponDto.userIds.length > 0
      ) {
        const users = await this.userRepository.findByIds(
          updateCouponDto.userIds,
        );
        if (users.length !== updateCouponDto.userIds.length) {
          return errorResponse('One or more users not found', 404);
        }
        coupon.users = users;
      } else if (updateCouponDto.isUserSpecific === false) {
        coupon.users = [];
      }

      const updatedCoupon = await this.couponRepository.save(coupon);
      return successResponse(updatedCoupon, 'Coupon updated successfully');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Soft-deletes a coupon. Never mutates orders — historical totals and
   * coupon snapshots on `orders.couponJson` stay exactly as placed.
   */
  async remove(idDto: IdDto) {
    try {
      const id = Number(idDto.id);
      const coupon = await this.couponRepository.findOne({
        where: { id, isDeleted: false },
      });

      if (!coupon) {
        throw new NotFoundException('Coupon not found');
      }

      coupon.isDeleted = true;
      coupon.isActive = false;
      coupon.couponCode = this.archiveUniqueValue(coupon.couponCode, coupon.id);

      await this.couponRepository.save(coupon);
      return successResponse(null, 'Coupon deleted successfully');
    } catch (error) {
      throw error;
    }
  }
}

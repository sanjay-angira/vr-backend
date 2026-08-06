import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer } from '../entities/product/offer.entity';
import { CreateOfferDto } from '../dto/offer.dto';
import { UpdateOfferDto } from '../dto/offer.dto';
import { PaginationDto } from '../dto/common.dto';
import {
  successResponse,
  errorResponse,
} from 'src/commonServices/response.service';
import { UtilityService } from 'src/commonServices/utility.service';
import { Category } from 'src/entities/productCategory/category.entity';
import { Product } from 'src/entities/product/product.entity';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly utilityService: UtilityService,
  ) {}

  async create(createOfferDto: CreateOfferDto) {
    const {
      offerName,
      discountValue,
      startDate,
      endDate,
      discountType,
      isActive,
      offerSlug,
      timeBased,
      image,
    } = createOfferDto;

    try {
      if (
        (timeBased && !startDate && !endDate) ||
        (timeBased && !startDate) ||
        (timeBased && !endDate)
      ) {
        throw new HttpException(
          'Please provide start and end date for time based offer',
          HttpStatus.BAD_REQUEST,
        );
      }

      const offerData = {
        offerName: offerName,
        offerSlug: offerSlug,
        image: image?.trim() || null,
        discountValue: discountValue,
        discountType: discountType,
        timeBased: timeBased,
        startDate: timeBased ? new Date(startDate) : undefined,
        endDate: timeBased ? new Date(endDate) : undefined,
        isActive: isActive,
      };

      const offer = this.offerRepository.create(offerData);
      const savedOffer = await this.offerRepository.save(offer);

      return successResponse(
        savedOffer,
        'Offer created successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      throw error;
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const {
      pageNumber,
      pageSize,
      search,
      column = 'createdAt',
      order = 'DESC',
    } = paginationDto;

    // Validate pagination parameters
    const isPageNumberValid =
      this.utilityService.validatePageNumber(pageNumber);
    const isPageSizeValid = this.utilityService.validatePageSize(pageSize);
    const isSearchValid = this.utilityService.validateSearch(search);

    try {
      const queryBuilder = this.offerRepository.createQueryBuilder('offer');

      // Apply search filter if valid
      if (isSearchValid && search) {
        queryBuilder.andWhere(
          `(offer.offerName ILIKE :search OR offer.offerSlug ILIKE :search OR CAST(offer.discountType AS TEXT) ILIKE :search OR CAST(offer.discountValue AS TEXT) ILIKE :search)`,
          { search: `%${search}%` },
        );
      }

      // Apply ordering
      const validColumns = [
        'id',
        'offerName',
        'offerSlug',
        'discountType',
        'discountValue',
        'createdAt',
        'updatedAt',
      ];
      const orderColumn = validColumns.includes(column) ? column : 'createdAt';
      queryBuilder.orderBy(
        `offer.${orderColumn}`,
        order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC',
      );

      // Get total count before pagination
      const count = await queryBuilder.getCount();

      // Apply pagination if valid
      if (isPageNumberValid && isPageSizeValid) {
        const page_number = Number(pageNumber);
        const page_size = Number(pageSize);
        const skip = (page_number - 1) * page_size;
        queryBuilder.skip(skip).take(page_size);
      }

      const rows = await queryBuilder.getMany();

      return successResponse(
        { rows, count },
        'Offers retrieved successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const offer = await this.offerRepository.findOne({
        where: { id },
        relations: ['categories', 'products', 'productVariants', 'brands'],
      });
      if (!offer) throw new NotFoundException('Offer not found');
      return successResponse(
        offer,
        'Offer retrieved successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      throw error;
    }
  }

  async update(id: number, updateOfferDto: UpdateOfferDto) {
    const {
      offerName,
      discountValue,
      startDate,
      endDate,
      discountType,
      isActive,
      offerSlug,
      timeBased,
      image,
    } = updateOfferDto;

    try {
      const offer = await this.offerRepository.findOne({ where: { id: id } });
      if (!offer) throw new NotFoundException('Offer not found');

      if (
        (timeBased && !startDate && !endDate) ||
        (timeBased && !startDate) ||
        (timeBased && !endDate)
      ) {
        throw new HttpException(
          'Please provide start and end date for time based offer',
          HttpStatus.BAD_REQUEST,
        );
      }

      offer.offerName = offerName;
      offer.offerSlug = offerSlug;
      offer.image = image?.trim() || null;
      offer.discountValue = discountValue;
      offer.discountType = discountType;
      offer.timeBased = timeBased;
      offer.startDate = timeBased ? new Date(startDate) : null;
      offer.endDate = timeBased ? new Date(endDate) : null;
      offer.isActive = isActive;

      const savedOffer = await this.offerRepository.save(offer);

      return successResponse(
        savedOffer,
        'Offer updated successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const offer = await this.offerRepository.findOne({
        where: { id: id },
        relations: ['categories', 'products'],
      });
      if (!offer) throw new NotFoundException('Offer not found');
      if (offer.categories.length > 0) {
        offer.categories = [];
      }
      if (offer.products?.length > 0) {
        offer.products = [];
      }
      await this.offerRepository.save(offer);
      await this.offerRepository.delete({ id: id });
      const response = successResponse(
        null,
        'Offer deleted successfully',
        HttpStatus.OK,
      );
      return response;
    } catch (error) {
      throw error;
    }
  }
}

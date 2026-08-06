import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attribute } from 'src/entities/product/attribute.entity';
import {
  AttributeQueryDto,
  CreateAttributeDto,
  UpdateAttributeDto,
} from '../dto/attribute.dto';
import { successResponse } from 'src/commonServices/response.service';
import { UtilityService } from 'src/commonServices/utility.service';

@Injectable()
export class AttributeService {
  constructor(
    @InjectRepository(Attribute)
    private attributeRepo: Repository<Attribute>,
    private readonly utilityService: UtilityService,
  ) {}

  async create(dto: CreateAttributeDto) {
    try {
      const exists = await this.attributeRepo.findOne({
        where: { name: dto.name },
      });

      if (exists) {
        throw new BadRequestException('Attribute already exists');
      }

      const attribute = this.attributeRepo.create({
        name: dto.name,
        isFilterable: dto.isFilterable,
        isRequired: dto.isRequired,
        supportsImage: dto.supportsImage ?? false,
      });

      const savedAttribute = await this.attributeRepo.save(attribute);

      return successResponse(savedAttribute, 'Attribute created successfully');
    } catch (error) {
      throw error;
    }
  }

  async findAll(pagination: AttributeQueryDto) {
    const { pageNumber, pageSize, search, column, order } = pagination;
    try {
      const isPageNumberValid =
        this.utilityService.validatePageNumber(pageNumber);
      const isPageSizeValid = this.utilityService.validatePageSize(pageSize);
      const queryBuilder = this.attributeRepo.createQueryBuilder('attribute');

      if (isPageNumberValid && isPageSizeValid) {
        const skip = (Number(pageNumber) - 1) * Number(pageSize);
        queryBuilder.skip(skip).take(Number(pageSize));
      }

      if (search && search.trim() !== '' && search !== 'null') {
        queryBuilder.andWhere('attribute.name LIKE :search', {
          search: `%${search}%`,
        });
      }

      if (column && order) {
        queryBuilder.orderBy(
          `attribute.${column}`,
          order.toUpperCase() as 'ASC' | 'DESC',
        );
      }

      const [rows, count] = await queryBuilder.getManyAndCount();

      return successResponse(
        { rows, count },
        'Attributes retrieved successfully',
      );
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const attribute = await this.attributeRepo.findOne({
        where: { id },
      });

      if (!attribute) {
        throw new NotFoundException('Attribute not found');
      }

      return successResponse(attribute, 'Attribute retrieved successfully');
    } catch (error) {
      throw error;
    }
  }

  async update(id: number, dto: UpdateAttributeDto) {
    try {
      const attribute = await this.attributeRepo.findOne({
        where: { id },
      });

      if (!attribute) {
        throw new NotFoundException('Attribute not found');
      }

      if (dto.name) attribute.name = dto.name;
      if (dto.isFilterable !== undefined)
        attribute.isFilterable = dto.isFilterable;
      if (dto.isRequired !== undefined) attribute.isRequired = dto.isRequired;
      if (dto.supportsImage !== undefined)
        attribute.supportsImage = dto.supportsImage;

      const savedAttribute = await this.attributeRepo.save(attribute);

      return successResponse(savedAttribute, 'Attribute updated successfully');
    } catch (error) {
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const attribute = await this.attributeRepo.findOne({ where: { id } });
      if (!attribute) {
        throw new NotFoundException('Attribute not found');
      }

      await this.attributeRepo.remove(attribute);
      return successResponse(null, 'Attribute deleted successfully');
    } catch (error) {
      throw error;
    }
  }
}

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CmsPage } from '../entities/CMS/cms-page.entity';
import {
  CreateCmsPageDto,
  CmsPageQueryDto,
  UpdateCmsPageDto,
} from '../dto/cms-page.dto';
import { successResponse } from '../commonServices/response.service';

@Injectable()
export class CmsPageService {
  constructor(
    @InjectRepository(CmsPage)
    private readonly cmsPageRepository: Repository<CmsPage>,
  ) {}

  private async ensureUniqueSlug(slug: string, excludeId?: number) {
    const existing = await this.cmsPageRepository.findOne({ where: { slug } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(
        `A CMS page with slug "${slug}" already exists`,
      );
    }
  }

  async create(dto: CreateCmsPageDto) {
    await this.ensureUniqueSlug(dto.slug);

    const page = this.cmsPageRepository.create({
      title: dto.title,
      slug: dto.slug,
      content: dto.content,
      isActive: dto.isActive ?? true,
    });

    const result = await this.cmsPageRepository.save(page);
    return successResponse(result, 'CMS page created successfully', 201);
  }

  async findAll(query: CmsPageQueryDto) {
    const pageNumber = Number(query.pageNumber) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const skip = (pageNumber - 1) * pageSize;

    const qb = this.cmsPageRepository.createQueryBuilder('cmsPage');

    if (query.search && query.search.trim() !== '' && query.search !== 'null') {
      qb.andWhere(
        '(cmsPage.title ILIKE :search OR cmsPage.slug ILIKE :search)',
        { search: `%${query.search.trim()}%` },
      );
    }

    const allowedColumns = [
      'id',
      'title',
      'slug',
      'isActive',
      'createdAt',
      'updatedAt',
    ];
    const column = query.column?.trim();
    const order = query.order?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    if (column && allowedColumns.includes(column)) {
      qb.orderBy(`cmsPage.${column}`, order);
    } else {
      qb.orderBy('cmsPage.id', 'DESC');
    }

    qb.skip(skip).take(pageSize);

    const [rows, count] = await qb.getManyAndCount();
    return successResponse({ rows, count }, 'CMS pages retrieved successfully');
  }

  async findOne(id: number) {
    const page = await this.cmsPageRepository.findOne({ where: { id } });
    if (!page) {
      throw new NotFoundException(`CMS page with id ${id} not found`);
    }
    return successResponse(page, 'CMS page retrieved successfully');
  }

  async findBySlug(slug: string, publicOnly = false) {
    const page = await this.cmsPageRepository.findOne({ where: { slug } });
    if (!page || (publicOnly && !page.isActive)) {
      throw new NotFoundException(`CMS page with slug "${slug}" not found`);
    }
    return successResponse(page, 'CMS page retrieved successfully');
  }

  async update(id: number, dto: UpdateCmsPageDto) {
    const page = await this.cmsPageRepository.findOne({ where: { id } });
    if (!page) {
      throw new NotFoundException(`CMS page with id ${id} not found`);
    }

    if (dto.slug) {
      await this.ensureUniqueSlug(dto.slug, id);
      page.slug = dto.slug;
    }

    if (dto.title !== undefined) {
      page.title = dto.title;
    }

    if (dto.content !== undefined) {
      page.content = dto.content;
    }

    if (dto.isActive !== undefined) {
      page.isActive = dto.isActive;
    }

    const result = await this.cmsPageRepository.save(page);
    return successResponse(result, 'CMS page updated successfully');
  }

  async remove(id: number) {
    const page = await this.cmsPageRepository.findOne({ where: { id } });
    if (!page) {
      throw new NotFoundException(`CMS page with id ${id} not found`);
    }

    await this.cmsPageRepository.remove(page);
    return successResponse(null, 'CMS page deleted successfully');
  }
}

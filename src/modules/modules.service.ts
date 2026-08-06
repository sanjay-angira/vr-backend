import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Modules } from '../entities/user/module.entity';
import { RoleModuleAccess } from '../entities/user/roleModuleAccess.entity';
import { CreateModuleDto, UpdateModuleDto } from '../dto/module.dto';
import {
  successResponse,
  errorResponse,
} from '../commonServices/response.service';
import { UtilityService } from '../commonServices/utility.service';
import { PaginationDto } from '../dto/common.dto';
import { UserTokenService } from '../commonServices/userToken.service';
import { UserPermissionsService } from '../permissions/user-permissions.service';

@Injectable()
export class ModulesService {
  constructor(
    @InjectRepository(Modules)
    private moduleRepository: Repository<Modules>,
    @InjectRepository(RoleModuleAccess)
    private roleModuleAccessRepository: Repository<RoleModuleAccess>,
    private utilityService: UtilityService,
    private userTokenService: UserTokenService,
    private userPermissionsService: UserPermissionsService,
  ) {}
  async createModule(createModuleDto: CreateModuleDto): Promise<any> {
    try {
      const module = this.moduleRepository.create(createModuleDto);
      const savedModule = await this.moduleRepository.save(module);
      return successResponse(savedModule, 'Module created successfully');
    } catch (error) {
      throw error;
    }
  }

  // Bulk create modules
  async addModules(bulkDto: any): Promise<any> {
    try {
      const modules = bulkDto.modules || [];
      const created = this.moduleRepository.create(modules);
      const saved = await this.moduleRepository.save(created);
      return successResponse(saved, 'Modules created successfully');
    } catch (error) {
      throw error;
    }
  }

  // Role access: replace existing access entries for a role
  async setRoleAccess(roleAccessDto: any): Promise<any> {
    try {
      const { roleId, moduleIds } = roleAccessDto;
      if (!roleId || !Array.isArray(moduleIds)) {
        return errorResponse('Invalid payload', 400);
      }

      await this.roleModuleAccessRepository.delete({ roleId });

      const inserts = moduleIds.map((mId: number) =>
        this.roleModuleAccessRepository.create({ roleId, moduleId: mId }),
      );
      const saved = await this.roleModuleAccessRepository.save(inserts);
      return successResponse(saved, 'Role access updated successfully');
    } catch (error) {
      throw error;
    }
  }

  // Update order values for modules
  async updateModulesOrder(dto: any): Promise<any> {
    try {
      const modules = dto.modules || [];

      // Only process valid entries that have numeric id and order
      const valid = modules.filter(
        (m: any) =>
          m && typeof m.id === 'number' && typeof m.order === 'number',
      );

      const promises = valid.map((m: any) =>
        this.moduleRepository.update(m.id, { order: m.order }),
      );
      await Promise.all(promises);
      return successResponse(null, 'Modules order updated successfully');
    } catch (error) {
      throw error;
    }
  }

  // Update categoryOrderNo for modules
  async updateModulesCategoryOrder(dto: any): Promise<any> {
    try {
      const categories = dto.categories || [];

      // For each category entry in the payload, find modules whose `categories` string
      // contains that category name and set their categoryOrderNo to the provided order.
      for (const c of categories) {
        const categoryName = c.category;
        const orderNo = c.order;

        if (!categoryName || typeof orderNo !== 'number') continue;

        await this.moduleRepository
          .createQueryBuilder()
          .update(Modules)
          .set({ categoryOrderNo: orderNo })
          .where('categories ILIKE :name', { name: `%${categoryName}%` })
          .execute();
      }

      return successResponse(
        null,
        'Modules category order updated successfully',
      );
    } catch (error) {
      throw error;
    }
  }

  // Update a single module's category field
  async updateModuleCategory(moduleId: number, dto: any): Promise<any> {
    try {
      const module = await this.moduleRepository.findOne({
        where: { id: moduleId },
      });
      if (!module) return errorResponse('Module not found', 404);
      await this.moduleRepository.update(moduleId, {
        categories: dto.category,
      });
      const updated = await this.moduleRepository.findOne({
        where: { id: moduleId },
      });
      return successResponse(updated, 'Module category updated successfully');
    } catch (error) {
      throw error;
    }
  }

  // Rename a category across modules
  async updateModulesCategoryName(dto: any): Promise<any> {
    try {
      const { oldCategory, newCategory, category_icon } = dto;
      if (!oldCategory || !newCategory || !category_icon)
        return errorResponse('Invalid payload', 400);
      const modules = await this.moduleRepository
        .createQueryBuilder('module')
        .where('module.categories ILIKE :name', { name: `%${oldCategory}%` })
        .getMany();

      const promises = modules.map((m) => {
        const updatedCategories = m.categories
          ? m.categories
              .split(',')
              .map((s) => s.trim())
              .map((s) => (s === oldCategory ? newCategory : s))
              .join(',')
          : m.categories;
        return this.moduleRepository.update(m.id, {
          categories: updatedCategories as any,
        });
      });
      await Promise.all(promises);
      return successResponse(null, 'Category name updated successfully');
    } catch (error) {
      throw error;
    }
  }

  // Delete a category from modules (remove occurrence)
  async deleteModulesCategory(dto: any): Promise<any> {
    try {
      const { category } = dto;
      if (!category) return errorResponse('Invalid payload', 400);
      const modules = await this.moduleRepository
        .createQueryBuilder('module')
        .where('module.categories ILIKE :name', { name: `%${category}%` })
        .getMany();

      const promises = modules.map((m) => {
        const updatedCategories = m.categories
          ? m.categories
              .split(',')
              .map((s) => s.trim())
              .filter((s) => s !== category)
              .join(',')
          : null;
        return this.moduleRepository.update(m.id, {
          categories: updatedCategories as any,
        });
      });
      await Promise.all(promises);
      return successResponse(
        null,
        'Category deleted from modules successfully',
      );
    } catch (error) {
      throw error;
    }
  }

  async getAllModules(
    paginationDto: PaginationDto,
    authorization?: string,
  ): Promise<any> {
    const {
      search,
      pageNumber,
      pageSize,
      column = 'id',
      order = 'DESC',
    } = paginationDto;

    const isPageNumberValid =
      this.utilityService.validatePageNumber(pageNumber);
    const isPageSizeValid = this.utilityService.validatePageSize(pageSize);
    const isSearchValid = this.utilityService.validateSearch(search);

    try {
      const queryBuilder = this.moduleRepository.createQueryBuilder('module');
      const userId = this.getUserIdFromAuthorization(authorization);
      if (userId) {
        const allowedModuleIds =
          await this.userPermissionsService.getAllowedModuleIds(userId);
        if (allowedModuleIds && allowedModuleIds.length === 0) {
          return successResponse(
            { rows: [], count: 0 },
            'Modules fetched successfully',
          );
        }
        if (allowedModuleIds && allowedModuleIds.length > 0) {
          queryBuilder.andWhere('module.id IN (:...allowedModuleIds)', {
            allowedModuleIds,
          });
        }
      }

      // Search filters
      if (isSearchValid) {
        queryBuilder.andWhere(
          `(module.name ILIKE :search OR module.categories ILIKE :search)`,
          { search: `%${search}%` },
        );
      }

      // Ordering
      const validColumns = ['id', 'name', 'createdAt', 'updatedAt'];
      const orderColumn = validColumns.includes(column) ? column : 'id';
      queryBuilder.orderBy(
        `module.${orderColumn}`,
        order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC',
      );

      // Count total before pagination
      const count = await queryBuilder.getCount();

      if (isPageNumberValid && isPageSizeValid) {
        const skip = (Number(pageNumber) - 1) * Number(pageSize);
        queryBuilder.skip(skip).take(Number(pageSize));
      }

      const rows = await queryBuilder.getMany();

      return successResponse({ rows, count }, 'Modules fetched successfully');
    } catch (error) {
      throw error;
    }
  }

  async getModuleById(id: number): Promise<any> {
    try {
      const module = await this.moduleRepository.findOne({ where: { id } });
      if (!module) {
        return errorResponse('Module not found', 404);
      }
      return successResponse(module, 'Module fetched successfully');
    } catch (error) {
      throw error;
    }
  }

  async updateModule(
    id: number,
    updateModuleDto: UpdateModuleDto,
  ): Promise<any> {
    try {
      const module = await this.moduleRepository.findOne({ where: { id } });
      if (!module) {
        return errorResponse('Module not found', 404);
      }
      await this.moduleRepository.update(id, updateModuleDto);
      const updatedModule = await this.moduleRepository.findOne({
        where: { id },
      });
      return successResponse(updatedModule, 'Module updated successfully');
    } catch (error) {
      throw error;
    }
  }

  async deleteModule(id: number): Promise<any> {
    try {
      const module = await this.moduleRepository.findOne({ where: { id } });
      if (!module) {
        return errorResponse('Module not found', 404);
      }
      await this.moduleRepository.delete(id);
      return successResponse(null, 'Module deleted successfully');
    } catch (error) {
      throw error;
    }
  }

  private getUserIdFromAuthorization(authorization?: string): number | null {
    try {
      if (!authorization || !authorization.startsWith('Bearer ')) {
        return null;
      }

      const token = authorization.split(' ')[1];
      const decodedToken = this.userTokenService.verifyAccessToken(token);
      return decodedToken?.userRes?.id || decodedToken?.id || null;
    } catch (error) {
      return null;
    }
  }
}

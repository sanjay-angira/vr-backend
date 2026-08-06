import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Role } from '../entities/user/role.entity';
import { RoleModuleAccess } from '../entities/user/roleModuleAccess.entity';
import { CreateRoleDto, UpdateRoleDto } from '../dto/role.dto';
import {
  successResponse,
  errorResponse,
} from '../commonServices/response.service';
import { UtilityService } from '../commonServices/utility.service';
import { PaginationDto } from '../dto/common.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(RoleModuleAccess)
    private roleModuleAccessRepository: Repository<RoleModuleAccess>,
    private utilityService: UtilityService,
  ) {}

  async createRole(createRoleDto: CreateRoleDto): Promise<any> {
    try {
      const role = this.roleRepository.create(createRoleDto as any);
      const saved = await this.roleRepository.save(role);
      return successResponse(saved, 'Role created successfully');
    } catch (error) {
      throw error;
    }
  }

  async getAllRoles(paginationDto: PaginationDto): Promise<any> {
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
      const query = this.roleRepository.createQueryBuilder('role');

      if (isSearchValid) {
        query.andWhere(
          `(role.roleName ILIKE :search OR CAST(role.roleId AS TEXT) ILIKE :search)`,
          { search: `%${search}%` },
        );
      }

      const validColumns = [
        'id',
        'roleId',
        'roleName',
        'createdAt',
        'updatedAt',
      ];
      const orderColumn = validColumns.includes(column) ? column : 'id';
      query.orderBy(
        `role.${orderColumn}`,
        order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC',
      );

      const count = await query.getCount();

      if (isPageNumberValid && isPageSizeValid) {
        const skip = (Number(pageNumber) - 1) * Number(pageSize);
        query.skip(skip).take(Number(pageSize));
      }

      const rows = await query.getMany();
      return successResponse({ rows, count }, 'Roles fetched successfully');
    } catch (error) {
      throw error;
    }
  }

  async getRoleById(id: number): Promise<any> {
    try {
      const role = await this.roleRepository.findOne({ where: { id } });
      if (!role) return errorResponse('Role not found', 404);
      return successResponse(role, 'Role fetched successfully');
    } catch (error) {
      throw error;
    }
  }

  async updateRole(id: number, updateRoleDto: UpdateRoleDto): Promise<any> {
    try {
      const role = await this.roleRepository.findOne({ where: { id } });
      if (!role) return errorResponse('Role not found', 404);
      await this.roleRepository.update(id, updateRoleDto as any);
      const updated = await this.roleRepository.findOne({ where: { id } });
      return successResponse(updated, 'Role updated successfully');
    } catch (error) {
      throw error;
    }
  }

  async deleteRole(id: number): Promise<any> {
    try {
      const role = await this.roleRepository.findOne({ where: { id } });
      if (!role) return errorResponse('Role not found', 404);
      // delete any role-module access entries
      await this.roleModuleAccessRepository.delete({ roleId: role.roleId });
      await this.roleRepository.delete(id);
      return successResponse(null, 'Role deleted successfully');
    } catch (error) {
      throw error;
    }
  }
}

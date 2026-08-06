import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Modules } from '../entities/user/module.entity';
import { Permissions } from '../entities/user/permissions.entity';

export interface UserPermissionRow {
  moduleId: number;
  moduleName: string;
  routerLink: string;
  category: string | null;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

@Injectable()
export class UserPermissionsService {
  constructor(
    @InjectRepository(Permissions)
    private readonly permissionsRepository: Repository<Permissions>,
    @InjectRepository(Modules)
    private readonly modulesRepository: Repository<Modules>,
  ) {}

  async getPermissionTemplate(): Promise<UserPermissionRow[]> {
    const modules = await this.modulesRepository.find({
      where: { isActive: true },
      order: { categoryOrderNo: 'ASC', order: 'ASC', id: 'ASC' },
    });

    return modules.map((module) => ({
      moduleId: module.id,
      moduleName: module.name,
      routerLink: module.router_link,
      category: module.categories || null,
      canView: false,
      canAdd: false,
      canEdit: false,
      canDelete: false,
    }));
  }

  async getPermissionsForUser(userId: number): Promise<UserPermissionRow[]> {
    const [template, savedPermissions] = await Promise.all([
      this.getPermissionTemplate(),
      this.permissionsRepository.find({ where: { userId } }),
    ]);

    const savedPermissionMap = new Map<number, Permissions>();
    savedPermissions.forEach((permission) =>
      savedPermissionMap.set(permission.moduleId, permission),
    );

    return template.map((permission) => {
      const existingPermission = savedPermissionMap.get(permission.moduleId);
      return {
        ...permission,
        canView: !!existingPermission?.canView,
        canAdd: !!existingPermission?.canAdd,
        canEdit: !!existingPermission?.canEdit,
        canDelete: !!existingPermission?.canDelete,
      };
    });
  }

  async updatePermissionsForUser(
    userId: number,
    permissions: Partial<UserPermissionRow>[],
  ): Promise<UserPermissionRow[]> {
    await this.permissionsRepository.delete({ userId });

    const rowsToSave = (permissions || [])
      .map((permission) => {
        const canView = !!permission.canView;
        const canAdd = !!permission.canAdd;
        const canEdit = !!permission.canEdit;
        const canDelete = !!permission.canDelete;

        if (
          !permission?.moduleId ||
          (!canView && !canAdd && !canEdit && !canDelete)
        ) {
          return null;
        }

        return this.permissionsRepository.create({
          userId,
          moduleId: Number(permission.moduleId),
          canView,
          canAdd,
          canEdit,
          canDelete,
        });
      })
      .filter(Boolean) as Permissions[];

    if (rowsToSave.length > 0) {
      await this.permissionsRepository.save(rowsToSave);
    }

    return this.getPermissionsForUser(userId);
  }

  async getAllowedModuleIds(userId: number): Promise<number[] | null> {
    const permissions = await this.permissionsRepository.find({
      where: { userId },
    });
    if (permissions.length === 0) {
      return null;
    }

    return permissions
      .filter((permission) => permission.canView)
      .map((permission) => permission.moduleId);
  }
}

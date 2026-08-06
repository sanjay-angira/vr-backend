import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Modules } from '../entities/user/module.entity';
import { Permissions } from '../entities/user/permissions.entity';
import { RoleModuleAccess } from '../entities/user/roleModuleAccess.entity';
import { ModulesService } from './modules.service';
import { ModulesController } from './modules.controller';
import { CommonModule } from '../commonServices/common.module';
import { UserPermissionsService } from '../permissions/user-permissions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Modules, RoleModuleAccess, Permissions]),
    CommonModule,
  ],
  controllers: [ModulesController],
  providers: [ModulesService, UserPermissionsService],
  exports: [ModulesService],
})
export class ModulesModule {}

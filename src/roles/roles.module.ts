import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { Role } from '../entities/user/role.entity';
import { RoleModuleAccess } from '../entities/user/roleModuleAccess.entity';
import { UserRole } from '../entities/user/userRole.entity';
import { UtilityService } from '../commonServices/utility.service';

@Module({
  imports: [TypeOrmModule.forFeature([Role, RoleModuleAccess, UserRole])],
  controllers: [RolesController],
  providers: [RolesService, UtilityService],
  exports: [RolesService],
})
export class RolesModule {}

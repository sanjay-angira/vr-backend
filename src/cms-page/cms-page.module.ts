import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CmsPage } from '../entities/CMS/cms-page.entity';
import { Modules } from '../entities/user/module.entity';
import { Permissions } from '../entities/user/permissions.entity';
import { RoleModuleAccess } from '../entities/user/roleModuleAccess.entity';
import { CmsPageController } from './cms-page.controller';
import { CmsPageService } from './cms-page.service';
import { CommonModule } from '../commonServices/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CmsPage, Modules, Permissions, RoleModuleAccess]),
    CommonModule,
  ],
  controllers: [CmsPageController],
  providers: [CmsPageService],
  exports: [CmsPageService],
})
export class CmsPageModule {}

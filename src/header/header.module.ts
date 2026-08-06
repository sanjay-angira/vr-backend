import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteSetting } from 'src/entities/CMS/header/site-setting.entity';
import { AnnouncementBar } from 'src/entities/CMS/header/announcement-bar.entity';
import { Menu } from 'src/entities/CMS/header/menu.entity';
import { MenuItem } from 'src/entities/CMS/header/menu-item.entity';
import { HeaderSettingsService } from './headerSetting/headerSettings.service';
import { AnnouncementBarsService } from './announcementBar/announcementBars.service';
import { MenusService } from './menu/menus.service';
import { MenuItemsService } from './menuItem/menuItems.service';
import { HeaderPublicService } from './headerPublic/headerPublic.service';
import { HeaderSettingsController } from './headerSetting/headerSettings.controller';
import { AnnouncementBarsController } from './announcementBar/announcementBars.controller';
import { MenusController } from './menu/menus.controller';
import { MenuItemsController } from './menuItem/menuItems.controller';
import { HeaderPublicController } from './headerPublic/headerPublic.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([SiteSetting, AnnouncementBar, Menu, MenuItem]),
  ],
  controllers: [
    HeaderSettingsController,
    AnnouncementBarsController,
    MenusController,
    MenuItemsController,
    HeaderPublicController,
  ],
  providers: [
    HeaderSettingsService,
    AnnouncementBarsService,
    MenusService,
    MenuItemsService,
    HeaderPublicService,
  ],
  exports: [
    HeaderSettingsService,
    AnnouncementBarsService,
    MenusService,
    MenuItemsService,
    HeaderPublicService,
  ],
})
export class HeaderModule {}

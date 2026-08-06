import { Injectable } from '@nestjs/common';
import { successResponse } from 'src/commonServices/response.service';
import { HeaderSettingsService } from '../headerSetting/headerSettings.service';
import { AnnouncementBarsService } from '../announcementBar/announcementBars.service';
import { MenusService } from '../menu/menus.service';

@Injectable()
export class HeaderPublicService {
  constructor(
    private readonly headerSettingsService: HeaderSettingsService,
    private readonly announcementBarsService: AnnouncementBarsService,
    private readonly menusService: MenusService,
  ) {}

  async getPublicHeader() {
    const settings = await this.headerSettingsService.getOrCreateSettings();
    const announcementBar =
      await this.announcementBarsService.findActiveForWebsite();
    const menu = await this.menusService.getActiveMenuTree(
      settings.activeMenuId,
    );

    return successResponse(
      {
        announcementBar,
        header: this.headerSettingsService.toPublicHeaderPayload(settings),
        menu,
      },
      'Website header retrieved successfully',
    );
  }
}

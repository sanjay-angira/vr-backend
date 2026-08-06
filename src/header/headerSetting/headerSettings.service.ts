import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiteSetting } from 'src/entities/CMS/header/site-setting.entity';
import { successResponse } from 'src/commonServices/response.service';
import { UpdateHeaderSettingsDto } from 'src/dto/header.dto';

const DEFAULT_HEADER = {
  logoUrl: null as string | null,
  mobileLogoUrl: null as string | null,
  stickyHeader: true,
  showSearch: true,
  showCart: true,
  showWishlist: true,
  showAccount: true,
  backgroundColor: '#ffffff',
  textColor: '#111111',
  activeMenuId: null as number | null,
};

@Injectable()
export class HeaderSettingsService {
  constructor(
    @InjectRepository(SiteSetting)
    private readonly siteSettingRepo: Repository<SiteSetting>,
  ) {}

  async getOrCreateSettings(): Promise<SiteSetting> {
    let settings = await this.siteSettingRepo.findOne({ where: { id: 1 } });

    if (!settings) {
      settings = this.siteSettingRepo.create({ id: 1, ...DEFAULT_HEADER });
      settings = await this.siteSettingRepo.save(settings);
    }

    return settings;
  }

  toHeaderPayload(settings: SiteSetting) {
    return {
      logoUrl: settings.logoUrl,
      mobileLogoUrl: settings.mobileLogoUrl ?? null,
      stickyHeader: settings.stickyHeader,
      showSearch: settings.showSearch,
      showCart: settings.showCart,
      showWishlist: settings.showWishlist,
      showAccount: settings.showAccount,
      backgroundColor: settings.backgroundColor,
      textColor: settings.textColor,
      activeMenuId: settings.activeMenuId,
    };
  }

  toPublicHeaderPayload(settings: SiteSetting) {
    return {
      logoUrl: settings.logoUrl,
      mobileLogoUrl: settings.mobileLogoUrl ?? null,
      stickyHeader: settings.stickyHeader,
      showSearch: settings.showSearch,
      showCart: settings.showCart,
      showWishlist: settings.showWishlist,
      showAccount: settings.showAccount,
      backgroundColor: settings.backgroundColor,
      textColor: settings.textColor,
    };
  }

  async getAdminHeaderSettings() {
    const settings = await this.getOrCreateSettings();
    return successResponse(
      this.toHeaderPayload(settings),
      'Header settings retrieved successfully',
    );
  }

  async updateHeaderSettings(dto: UpdateHeaderSettingsDto) {
    const settings = await this.getOrCreateSettings();
    Object.assign(settings, dto);
    const saved = await this.siteSettingRepo.save(settings);
    return successResponse(
      this.toHeaderPayload(saved),
      'Header settings updated successfully',
    );
  }
}

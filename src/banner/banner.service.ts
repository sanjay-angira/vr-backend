import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateBannerDto } from '../dto/banner.dto';
import { UpdateBannerDto } from '../dto/banner.dto';
import { Banner } from '../entities/CMS/banner.entity';
import { successResponse } from 'src/commonServices/response.service';

const DEPRECATED_BANNER_COLUMNS = [
  'buttonText',
  'textColor',
  'backgroundColor',
  'button_text',
  'text_color',
  'background_color',
];

@Injectable()
export class BannerService implements OnModuleInit {
  constructor(
    @InjectRepository(Banner)
    private readonly bannerRepo: Repository<Banner>,
  ) {}

  async onModuleInit() {
    await this.dropDeprecatedBannerColumns();
    await this.renameButtonLinkColumn();
  }

  private async renameButtonLinkColumn() {
    const renames: Array<[string, string]> = [
      ['"buttonLink"', '"bannerLink"'],
      ['button_link', 'banner_link'],
    ];

    for (const [from, to] of renames) {
      try {
        await this.bannerRepo.query(
          `ALTER TABLE banners RENAME COLUMN ${from} TO ${to}`,
        );
      } catch {
        // Column may already be renamed or not exist.
      }
    }
  }

  private async dropDeprecatedBannerColumns() {
    for (const column of DEPRECATED_BANNER_COLUMNS) {
      try {
        await this.bannerRepo.query(
          `ALTER TABLE banners DROP COLUMN IF EXISTS "${column}"`,
        );
      } catch {
        try {
          await this.bannerRepo.query(
            `ALTER TABLE banners DROP COLUMN IF EXISTS ${column}`,
          );
        } catch {
          // Column may already be removed or use a different naming strategy.
        }
      }
    }
  }

  private sanitizeBannerDto<T extends CreateBannerDto | UpdateBannerDto>(
    dto: T,
  ): T {
    const {
      buttonText: _buttonText,
      textColor: _textColor,
      backgroundColor: _backgroundColor,
      buttonLink,
      ...rest
    } = dto as T & {
      buttonText?: string;
      textColor?: string;
      backgroundColor?: string;
      buttonLink?: string;
    };

    if (buttonLink !== undefined && rest.bannerLink === undefined) {
      return { ...rest, bannerLink: buttonLink } as T;
    }

    return rest as T;
  }

  async create(createBannerDto: CreateBannerDto) {
    try {
      const bannerInstase = this.bannerRepo.create({
        ...this.sanitizeBannerDto(createBannerDto),
      });
      const banner = await this.bannerRepo.save(bannerInstase);
      return successResponse(banner, 'Banner created successfully');
    } catch (error) {
      throw error;
    }
  }

  async findAll() {
    try {
      const [rows, count] = await this.bannerRepo.findAndCount();
      return successResponse({ rows, count }, 'Banners retrieved successfully');
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const banner = await this.bannerRepo.findOne({
        where: { id },
      });

      if (!banner) {
        throw new NotFoundException('Banner not found');
      }

      return successResponse(banner, 'Banner retrieved successfully');
    } catch (error) {
      throw error;
    }
  }

  async update(id: number, updateBannerDto: UpdateBannerDto) {
    try {
      const banner = await this.bannerRepo.findOne({
        where: { id },
      });
      if (!banner) {
        throw new NotFoundException('Banner not found');
      }
      Object.assign(banner, this.sanitizeBannerDto(updateBannerDto));
      return await this.bannerRepo.save(banner);
    } catch (error) {
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const banner = await this.bannerRepo.findOne({
        where: { id },
      });

      if (!banner) {
        throw new NotFoundException('Banner not found');
      }
      await this.bannerRepo.remove(banner);

      return successResponse(null, 'Banner deleted successfully');
    } catch (error) {
      throw error;
    }
  }
}

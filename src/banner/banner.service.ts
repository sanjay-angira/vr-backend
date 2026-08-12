import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateBannerDto } from '../dto/banner.dto';
import { UpdateBannerDto } from '../dto/banner.dto';
import { Banner } from '../entities/CMS/banner.entity';
import {
  BannerImage,
  BannerImageRole,
} from '../entities/CMS/banner-image.entity';
import { successResponse } from 'src/commonServices/response.service';
import { resolveImageAsset } from 'src/commonServices/image-asset.util';

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
    @InjectRepository(BannerImage)
    private readonly bannerImageRepo: Repository<BannerImage>,
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
          // ignore
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

  private presentBanner(banner: Banner) {
    const desktop = banner.images?.find(
      (img) => img.role === BannerImageRole.DESKTOP,
    );
    const mobile = banner.images?.find(
      (img) => img.role === BannerImageRole.MOBILE,
    );
    return {
      ...banner,
      image: desktop?.originalUrl ?? null,
      mobileImage: mobile?.originalUrl ?? null,
    };
  }

  private async upsertBannerImage(
    bannerId: number,
    role: BannerImageRole,
    url: string | null | undefined,
  ) {
    const resolved = resolveImageAsset(url, null);
    if (!resolved?.originalUrl) {
      await this.bannerImageRepo.delete({ banner: { id: bannerId }, role });
      return;
    }

    let row = await this.bannerImageRepo.findOne({
      where: { banner: { id: bannerId }, role },
    });

    if (!row) {
      row = this.bannerImageRepo.create({
        banner: { id: bannerId } as Banner,
        role,
        sortOrder: role === BannerImageRole.DESKTOP ? 0 : 1,
        originalUrl: resolved.originalUrl,
      });
    }

    row.originalUrl = resolved.originalUrl;
    row.webp800 = resolved.webp800 ?? null;
    row.jpg800 = resolved.jpg800 ?? null;
    row.webp1200 = resolved.webp1200 ?? null;
    row.jpg1200 = resolved.jpg1200 ?? null;
    row.webp1440 = resolved.webp1440 ?? null;
    row.jpg1440 = resolved.jpg1440 ?? null;
    row.webp1920 = resolved.webp1920 ?? null;
    row.jpg1920 = resolved.jpg1920 ?? null;

    await this.bannerImageRepo.save(row);
  }

  async create(createBannerDto: CreateBannerDto) {
    try {
      const sanitized = this.sanitizeBannerDto(createBannerDto);
      const { image, mobileImage, ...bannerFields } = sanitized;

      const banner = await this.bannerRepo.save(
        this.bannerRepo.create(bannerFields),
      );

      await this.upsertBannerImage(banner.id, BannerImageRole.DESKTOP, image);
      await this.upsertBannerImage(
        banner.id,
        BannerImageRole.MOBILE,
        mobileImage,
      );

      const full = await this.bannerRepo.findOne({
        where: { id: banner.id },
        relations: ['images'],
      });

      return successResponse(
        full ? this.presentBanner(full) : full,
        'Banner created successfully',
      );
    } catch (error) {
      throw error;
    }
  }

  async findAll() {
    try {
      const [rows, count] = await this.bannerRepo.findAndCount({
        relations: ['images'],
      });
      return successResponse(
        { rows: rows.map((row) => this.presentBanner(row)), count },
        'Banners retrieved successfully',
      );
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const banner = await this.bannerRepo.findOne({
        where: { id },
        relations: ['images'],
      });

      if (!banner) {
        throw new NotFoundException('Banner not found');
      }

      return successResponse(
        this.presentBanner(banner),
        'Banner retrieved successfully',
      );
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

      const sanitized = this.sanitizeBannerDto(updateBannerDto);
      const { image, mobileImage, ...bannerFields } = sanitized;

      Object.assign(banner, bannerFields);
      await this.bannerRepo.save(banner);

      if (image !== undefined) {
        await this.upsertBannerImage(id, BannerImageRole.DESKTOP, image);
      }
      if (mobileImage !== undefined) {
        await this.upsertBannerImage(id, BannerImageRole.MOBILE, mobileImage);
      }

      const full = await this.bannerRepo.findOne({
        where: { id },
        relations: ['images'],
      });

      return successResponse(
        full ? this.presentBanner(full) : full,
        'Banner updated successfully',
      );
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

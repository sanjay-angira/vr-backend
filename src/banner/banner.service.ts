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

  async create(createBannerDto: CreateBannerDto) {
    const sanitized = this.sanitizeBannerDto(createBannerDto);
    const banner = await this.bannerRepo.save(
      this.bannerRepo.create(sanitized),
    );
    return successResponse(banner, 'Banner created successfully');
  }

  async findAll() {
    const [rows, count] = await this.bannerRepo.findAndCount();
    return successResponse(
      { rows, count },
      'Banners retrieved successfully',
    );
  }

  async findOne(id: number) {
    const banner = await this.bannerRepo.findOne({ where: { id } });
    if (!banner) {
      throw new NotFoundException('Banner not found');
    }
    return successResponse(banner, 'Banner retrieved successfully');
  }

  async update(id: number, updateBannerDto: UpdateBannerDto) {
    const banner = await this.bannerRepo.findOne({ where: { id } });
    if (!banner) {
      throw new NotFoundException('Banner not found');
    }

    const sanitized = this.sanitizeBannerDto(updateBannerDto);
    Object.assign(banner, sanitized);
    await this.bannerRepo.save(banner);

    return successResponse(banner, 'Banner updated successfully');
  }

  async remove(id: number) {
    const banner = await this.bannerRepo.findOne({ where: { id } });
    if (!banner) {
      throw new NotFoundException('Banner not found');
    }
    await this.bannerRepo.remove(banner);
    return successResponse(null, 'Banner deleted successfully');
  }
}

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
  'buttontext',
  'textcolor',
  'backgroundcolor',
  'button_text',
  'text_color',
  'background_color',
];

const LEGACY_BANNER_LINK_COLUMNS = [
  'buttonLink',
  'button_link',
  'buttonlink',
  'banner_link',
  'bannerlink',
];

@Injectable()
export class BannerService implements OnModuleInit {
  constructor(
    @InjectRepository(Banner)
    private readonly bannerRepo: Repository<Banner>,
  ) {}

  async onModuleInit() {
    await this.renameButtonLinkColumn();
    await this.dropDeprecatedBannerColumns();
  }

  private async renameButtonLinkColumn() {
    const rows: Array<{ column_name: string }> = await this.bannerRepo.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'banners'`,
    );
    const columns = new Set(rows.map(({ column_name }) => column_name));

    if (!columns.size) return;

    const target = 'bannerLink';
    for (const legacyColumn of LEGACY_BANNER_LINK_COLUMNS) {
      if (!columns.has(legacyColumn)) continue;

      if (!columns.has(target)) {
        await this.bannerRepo.query(
          `ALTER TABLE "banners" RENAME COLUMN "${legacyColumn}" TO "${target}"`,
        );
        columns.delete(legacyColumn);
        columns.add(target);
        continue;
      }

      await this.bannerRepo.query(
        `UPDATE "banners"
         SET "${target}" = COALESCE(NULLIF("${target}"::text, ''), "${legacyColumn}"::text)
         WHERE "${legacyColumn}" IS NOT NULL
           AND ("${target}" IS NULL OR "${target}"::text = '')`,
      );
      await this.bannerRepo.query(
        `ALTER TABLE "banners" DROP COLUMN "${legacyColumn}"`,
      );
      columns.delete(legacyColumn);
    }
  }

  private async dropDeprecatedBannerColumns() {
    for (const column of DEPRECATED_BANNER_COLUMNS) {
      const rows: unknown[] = await this.bannerRepo.query(
        `SELECT 1
         FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'banners'
           AND column_name = $1`,
        [column],
      );

      if (rows.length) {
        await this.bannerRepo.query(
          `ALTER TABLE "banners" DROP COLUMN "${column}"`,
        );
      }
    }
  }

  private sanitizeBannerDto<T extends CreateBannerDto | UpdateBannerDto>(
    dto: T,
  ): T {
    const legacyDto = dto as T & {
      buttonText?: string;
      textColor?: string;
      backgroundColor?: string;
      buttonLink?: string;
    };
    const sanitized = { ...dto } as T & Record<string, unknown>;
    delete sanitized.buttonText;
    delete sanitized.textColor;
    delete sanitized.backgroundColor;
    delete sanitized.buttonLink;

    if (
      legacyDto.buttonLink !== undefined &&
      sanitized.bannerLink === undefined
    ) {
      return { ...sanitized, bannerLink: legacyDto.buttonLink } as T;
    }

    return sanitized as T;
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
    return successResponse({ rows, count }, 'Banners retrieved successfully');
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

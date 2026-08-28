import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FooterItem } from 'src/entities/CMS/footer/footerItem.entity';
import { successResponse } from 'src/commonServices/response.service';

@Injectable()
export class FooterPublicService {
  constructor(
    @InjectRepository(FooterItem)
    private readonly footerItemRepo: Repository<FooterItem>,
  ) {}

  async getPublicFooterItems() {
    const items = await this.footerItemRepo.find({
      where: { status: true },
      relations: { section: true },
      order: { position: 'ASC' },
    });

    const rows = items
      .filter(
        (item) =>
          item.section?.status === true && item.section?.type === 'menu',
      )
      .map((item) => ({
        id: item.id,
        label: item.label,
        url: item.url || '',
        position: item.position,
        sectionTitle: item.section?.title || 'Information',
        sectionPosition: item.section?.position ?? 0,
      }));

    return successResponse(
      { items: rows },
      'Footer items retrieved successfully',
    );
  }
}

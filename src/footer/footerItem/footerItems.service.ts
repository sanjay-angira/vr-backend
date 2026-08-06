import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FooterItem } from 'src/entities/CMS/footer/footerItem.entity';
import {
  errorResponse,
  successResponse,
} from 'src/commonServices/response.service';
@Injectable()
export class FooterItemsService {
  constructor(
    @InjectRepository(FooterItem)
    private footerItemRepo: Repository<FooterItem>,
  ) {}

  async findAll() {
    const items = await this.footerItemRepo.find({
      relations: {
        section: true,
      },
      order: {
        position: 'ASC',
      },
    });
    return successResponse(items, 'Footer items retrieved successfully');
  }

  async findBySection(sectionId: number) {
    return this.footerItemRepo.find({
      where: {
        sectionId,
      },
      order: {
        position: 'ASC',
      },
    });
  }

  create(payload: Partial<FooterItem>) {
    const item = this.footerItemRepo.create(payload);

    return this.footerItemRepo.save(item);
  }

  async update(id: number, payload: Partial<FooterItem>) {
    const item = await this.footerItemRepo.findOne({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException();
    }

    Object.assign(item, payload);

    return this.footerItemRepo.save(item);
  }

  async remove(id: number) {
    const item = await this.footerItemRepo.findOne({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException();
    }

    return this.footerItemRepo.remove(item);
  }
}

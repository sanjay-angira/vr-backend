import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnnouncementBar } from 'src/entities/CMS/header/announcement-bar.entity';
import { successResponse } from 'src/commonServices/response.service';
import {
  CreateAnnouncementBarDto,
  UpdateAnnouncementBarDto,
} from 'src/dto/header.dto';

@Injectable()
export class AnnouncementBarsService {
  constructor(
    @InjectRepository(AnnouncementBar)
    private readonly announcementBarRepo: Repository<AnnouncementBar>,
  ) {}

  private toPayload(bar: AnnouncementBar) {
    return {
      id: bar.id,
      isActive: bar.isActive,
      message: bar.message,
      linkText: bar.linkText,
      linkUrl: bar.linkUrl,
      backgroundColor: bar.backgroundColor,
      textColor: bar.textColor,
      startDate: bar.startDate,
      endDate: bar.endDate,
      priority: bar.priority,
      createdAt: bar.createdAt,
      updatedAt: bar.updatedAt,
    };
  }

  async findAll() {
    const bars = await this.announcementBarRepo.find({
      order: { priority: 'DESC', id: 'DESC' },
    });
    return successResponse(
      bars.map((bar) => this.toPayload(bar)),
      'Announcement bars retrieved successfully',
    );
  }

  async findActiveForWebsite() {
    const now = new Date();
    const bars = await this.announcementBarRepo
      .createQueryBuilder('bar')
      .where('bar.isActive = :isActive', { isActive: true })
      .andWhere('(bar.startDate IS NULL OR bar.startDate <= :now)', { now })
      .andWhere('(bar.endDate IS NULL OR bar.endDate >= :now)', { now })
      .orderBy('bar.priority', 'DESC')
      .addOrderBy('bar.id', 'DESC')
      .getMany();

    if (!bars.length) {
      return null;
    }

    const bar = bars[0];
    return {
      id: bar.id,
      isActive: bar.isActive,
      message: bar.message,
      linkText: bar.linkText,
      linkUrl: bar.linkUrl,
      backgroundColor: bar.backgroundColor,
      textColor: bar.textColor,
    };
  }

  async create(dto: CreateAnnouncementBarDto) {
    const bar = this.announcementBarRepo.create(dto);
    const saved = await this.announcementBarRepo.save(bar);
    return successResponse(
      this.toPayload(saved),
      'Announcement bar created successfully',
      201,
    );
  }

  async update(id: number, dto: UpdateAnnouncementBarDto) {
    const bar = await this.announcementBarRepo.findOne({ where: { id } });
    if (!bar) {
      throw new NotFoundException('Announcement bar not found');
    }
    Object.assign(bar, dto);
    const saved = await this.announcementBarRepo.save(bar);
    return successResponse(
      this.toPayload(saved),
      'Announcement bar updated successfully',
    );
  }

  async remove(id: number) {
    const bar = await this.announcementBarRepo.findOne({ where: { id } });
    if (!bar) {
      throw new NotFoundException('Announcement bar not found');
    }
    await this.announcementBarRepo.remove(bar);
    return successResponse(null, 'Announcement bar deleted successfully');
  }
}

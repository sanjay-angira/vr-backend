import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FooterSetting } from 'src/entities/CMS/footer/footerSetting.entity';

@Injectable()
export class FooterSettingsService {
  constructor(
    @InjectRepository(FooterSetting)
    private footerSettingRepo: Repository<FooterSetting>,
  ) {}

  async findOne() {
    return this.footerSettingRepo.findOne({
      where: { id: 1 },
    });
  }

  async create(payload: Partial<FooterSetting>) {
    // Ensure only one footer settings record exists (ID = 1)
    const existing = await this.footerSettingRepo.findOne({
      where: { id: 1 },
    });

    if (existing) {
      // If record exists, update it instead
      Object.assign(existing, payload);
      return this.footerSettingRepo.save(existing);
    }

    // Create new record with ID = 1
    const setting = this.footerSettingRepo.create({
      id: 1,
      ...payload,
    });

    return this.footerSettingRepo.save(setting);
  }

  async update(id: number, payload: Partial<FooterSetting>) {
    const setting = await this.footerSettingRepo.findOne({
      where: { id },
    });

    if (!setting) {
      throw new NotFoundException();
    }

    Object.assign(setting, payload);

    return this.footerSettingRepo.save(setting);
  }
}

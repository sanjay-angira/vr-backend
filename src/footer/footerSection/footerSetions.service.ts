import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FooterSection } from 'src/entities/CMS/footer/footerSection.entity';

@Injectable()
export class FooterSectionsService {
  constructor(
    @InjectRepository(FooterSection)
    private footerSectionRepo: Repository<FooterSection>,
  ) {}

  findAll() {
    return this.footerSectionRepo.find({
      order: {
        position: 'ASC',
      },
    });
  }

  create(payload: Partial<FooterSection>) {
    const section = this.footerSectionRepo.create(payload);

    return this.footerSectionRepo.save(section);
  }

  async update(id: number, payload: Partial<FooterSection>) {
    const section = await this.footerSectionRepo.findOne({
      where: { id },
    });

    if (!section) {
      throw new NotFoundException();
    }

    Object.assign(section, payload);

    return this.footerSectionRepo.save(section);
  }

  async remove(id: number) {
    const section = await this.footerSectionRepo.findOne({
      where: { id },
    });

    if (!section) {
      throw new NotFoundException();
    }

    return this.footerSectionRepo.remove(section);
  }
}

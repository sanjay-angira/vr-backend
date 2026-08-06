import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FooterSocialLink } from 'src/entities/CMS/footer/footerSocialLink.entity';
import {
  errorResponse,
  successResponse,
} from 'src/commonServices/response.service';

@Injectable()
export class FooterSocialLinksService {
  constructor(
    @InjectRepository(FooterSocialLink)
    private footerSocialLinkRepo: Repository<FooterSocialLink>,
  ) {}

  async findAll() {
    const links = await this.footerSocialLinkRepo.find({
      relations: {
        section: true,
      },
      order: {
        position: 'ASC',
      },
    });
    return successResponse(links, 'Footer social links retrieved successfully');
  }

  async findBySection(sectionId: number) {
    const links = await this.footerSocialLinkRepo.find({
      where: {
        sectionId,
      },
      order: {
        position: 'ASC',
      },
    });
    return successResponse(links, 'Footer social links retrieved successfully');
  }

  create(payload: Partial<FooterSocialLink>) {
    const link = this.footerSocialLinkRepo.create(payload);
    return this.footerSocialLinkRepo.save(link);
  }

  async update(id: number, payload: Partial<FooterSocialLink>) {
    const link = await this.footerSocialLinkRepo.findOne({
      where: { id },
    });

    if (!link) {
      throw new NotFoundException();
    }

    Object.assign(link, payload);
    return this.footerSocialLinkRepo.save(link);
  }

  async remove(id: number) {
    const link = await this.footerSocialLinkRepo.findOne({
      where: { id },
    });

    if (!link) {
      throw new NotFoundException();
    }

    return this.footerSocialLinkRepo.remove(link);
  }
}

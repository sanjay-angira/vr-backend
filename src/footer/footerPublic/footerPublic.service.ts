import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FooterSetting } from 'src/entities/CMS/footer/footerSetting.entity';
import { FooterSection } from 'src/entities/CMS/footer/footerSection.entity';
import { FooterItem } from 'src/entities/CMS/footer/footerItem.entity';
import { FooterSocialLink } from 'src/entities/CMS/footer/footerSocialLink.entity';
import { FooterPaymentMethod } from 'src/entities/CMS/footer/footerPaymentMethod.entity';
import { successResponse } from 'src/commonServices/response.service';

@Injectable()
export class FooterPublicService {
  constructor(
    @InjectRepository(FooterSetting)
    private footerSettingRepo: Repository<FooterSetting>,
    @InjectRepository(FooterSection)
    private footerSectionRepo: Repository<FooterSection>,
    @InjectRepository(FooterItem)
    private footerItemRepo: Repository<FooterItem>,
    @InjectRepository(FooterSocialLink)
    private footerSocialLinkRepo: Repository<FooterSocialLink>,
    @InjectRepository(FooterPaymentMethod)
    private footerPaymentMethodRepo: Repository<FooterPaymentMethod>,
  ) {}

  async getPublicFooter() {
    const settings = await this.footerSettingRepo.findOne({
      where: { id: 1, status: true },
    });

    const sections = await this.footerSectionRepo.find({
      where: { status: true },
      order: { position: 'ASC' },
    });

    const [items, socialLinks, paymentMethods] = await Promise.all([
      this.footerItemRepo.find({
        where: { status: true },
        order: { position: 'ASC' },
      }),
      this.footerSocialLinkRepo.find({
        where: { status: true },
        order: { position: 'ASC' },
      }),
      this.footerPaymentMethodRepo.find({
        where: { status: true },
        order: { position: 'ASC' },
      }),
    ]);

    const sectionsWithContent = sections.map((section) => ({
      id: section.id,
      title: section.title,
      type: section.type,
      position: section.position,
      items: items
        .filter((item) => item.sectionId === section.id)
        .map(({ id, label, url, icon, position }) => ({
          id,
          label,
          url,
          icon,
          position,
        })),
      socialLinks: socialLinks
        .filter((link) => link.sectionId === section.id)
        .map(({ id, label, url, icon, position }) => ({
          id,
          label,
          url,
          icon,
          position,
        })),
      paymentMethods: paymentMethods
        .filter((method) => method.sectionId === section.id)
        .map(({ id, label, url, icon, position }) => ({
          id,
          label,
          url,
          icon,
          position,
        })),
    }));

    return successResponse(
      {
        settings: settings
          ? {
              email: settings.email,
              phone: settings.phone,
              address: settings.address,
              copyrightText: settings.copyrightText,
            }
          : null,
        sections: sectionsWithContent,
      },
      'Footer data retrieved successfully',
    );
  }
}

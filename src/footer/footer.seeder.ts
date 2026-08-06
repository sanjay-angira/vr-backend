import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FooterSetting } from 'src/entities/CMS/footer/footerSetting.entity';
import { FooterSection } from 'src/entities/CMS/footer/footerSection.entity';

@Injectable()
export class FooterSeeder implements OnModuleInit {
  constructor(
    @InjectRepository(FooterSetting)
    private footerSettingRepo: Repository<FooterSetting>,
    @InjectRepository(FooterSection)
    private footerSectionRepo: Repository<FooterSection>,
  ) {}

  async onModuleInit() {
    await this.seedFooterSettings();
    await this.seedDefaultSections();
  }

  private async seedFooterSettings() {
    // Check if footer settings already exist
    const existingSettings = await this.footerSettingRepo.findOne({
      where: { id: 1 },
    });

    if (!existingSettings) {
      // Create default footer settings
      const defaultSettings = this.footerSettingRepo.create({
        id: 1,
        email: 'contact@example.com',
        phone: '+1-234-567-8900',
        address: '123 Main Street, City, Country',
        copyrightText: `© ${new Date().getFullYear()} All Rights Reserved`,
        status: true,
      });

      await this.footerSettingRepo.save(defaultSettings);
      console.log('✅ Default footer settings created');
    }
  }

  private async seedDefaultSections() {
    // Check if sections already exist
    const existingSections = await this.footerSectionRepo.find();

    if (existingSections.length === 0) {
      // Create default footer sections
      const defaultSections = [
        {
          title: 'Information',
          type: 'menu',
          position: 1,
          status: true,
        },
        {
          title: 'Follow Us',
          type: 'social',
          position: 2,
          status: true,
        },
        {
          title: 'Contact',
          type: 'contact',
          position: 3,
          status: true,
        },
        {
          title: 'Payment Methods',
          type: 'payment',
          position: 4,
          status: true,
        },
      ];

      for (const section of defaultSections) {
        await this.footerSectionRepo.save(
          this.footerSectionRepo.create(section),
        );
      }

      console.log('✅ Default footer sections created');
    }
  }
}

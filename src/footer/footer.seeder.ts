import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FooterSection } from 'src/entities/CMS/footer/footerSection.entity';

@Injectable()
export class FooterSeeder implements OnModuleInit {
  constructor(
    @InjectRepository(FooterSection)
    private footerSectionRepo: Repository<FooterSection>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultSections();
  }

  private async seedDefaultSections() {
    const existingSections = await this.footerSectionRepo.find();
    if (existingSections.length > 0) return;

    const defaultSections = [
      { title: 'Information', type: 'menu', position: 1, status: true },
      { title: 'Policies', type: 'menu', position: 2, status: true },
    ];

    for (const section of defaultSections) {
      await this.footerSectionRepo.save(this.footerSectionRepo.create(section));
    }

    console.log('✅ Default footer menu sections created');
  }
}

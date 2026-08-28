import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FooterItem } from 'src/entities/CMS/footer/footerItem.entity';
import { FooterSection } from 'src/entities/CMS/footer/footerSection.entity';

import { FooterSectionsController } from './footerSection/footerSetions.controller';
import { FooterItemsController } from './footerItem/footerItems.controller';

import { FooterSectionsService } from './footerSection/footerSetions.service';
import { FooterItemsService } from './footerItem/footerItems.service';
import { FooterSeeder } from './footer.seeder';
import { FooterPublicController } from './footerPublic/footerPublic.controller';
import { FooterPublicService } from './footerPublic/footerPublic.service';

@Module({
  imports: [TypeOrmModule.forFeature([FooterSection, FooterItem])],

  controllers: [
    FooterSectionsController,
    FooterItemsController,
    FooterPublicController,
  ],

  providers: [
    FooterSectionsService,
    FooterItemsService,
    FooterPublicService,
    FooterSeeder,
  ],

  exports: [FooterSectionsService, FooterItemsService],
})
export class FooterModule {}

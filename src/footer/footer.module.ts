import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FooterItem } from 'src/entities/CMS/footer/footerItem.entity';
import { FooterSection } from 'src/entities/CMS/footer/footerSection.entity';
import { FooterSetting } from 'src/entities/CMS/footer/footerSetting.entity';
import { FooterSocialLink } from 'src/entities/CMS/footer/footerSocialLink.entity';
import { FooterPaymentMethod } from 'src/entities/CMS/footer/footerPaymentMethod.entity';

import { FooterSettingsController } from './footerSetting/footerSettings.controller';
import { FooterSectionsController } from './footerSection/footerSetions.controller';
import { FooterItemsController } from './footerItem/footerItems.controller';
import { FooterSocialLinksController } from './footerSocialLink/footerSocialLinks.controller';
import { FooterPaymentMethodsController } from './footerPaymentMethod/footerPaymentMethods.controller';

import { FooterSettingsService } from './footerSetting/footerSettings.service';
import { FooterSectionsService } from './footerSection/footerSetions.service';
import { FooterItemsService } from './footerItem/footerItems.service';
import { FooterSocialLinksService } from './footerSocialLink/footerSocialLinks.service';
import { FooterPaymentMethodsService } from './footerPaymentMethod/footerPaymentMethods.service';
import { FooterSeeder } from './footer.seeder';
import { FooterPublicController } from './footerPublic/footerPublic.controller';
import { FooterPublicService } from './footerPublic/footerPublic.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FooterSetting,
      FooterSection,
      FooterItem,
      FooterSocialLink,
      FooterPaymentMethod,
    ]),
  ],

  controllers: [
    FooterSettingsController,
    FooterSectionsController,
    FooterItemsController,
    FooterSocialLinksController,
    FooterPaymentMethodsController,
    FooterPublicController,
  ],

  providers: [
    FooterSettingsService,
    FooterSectionsService,
    FooterItemsService,
    FooterSocialLinksService,
    FooterPaymentMethodsService,
    FooterPublicService,
    FooterSeeder,
  ],

  exports: [FooterSettingsService, FooterSectionsService, FooterItemsService],
})
export class FooterModule {}

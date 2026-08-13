import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SettingsModule } from './settings/settings.module';
import { ModulesModule } from './modules/modules.module';
import { RolesModule } from './roles/roles.module';
import { BlogModule } from './blog/blog.module';
import { OffersModule } from './offers/offers.module';
import { BrandsModule } from './brands/brands.module';
import { FaqModule } from './faq/faq.module';
import { CouponsModule } from './coupons/coupons.module';
import { ProductTagsModule } from './tags/product-tags.module';
import { AttributeModule } from './attribute/attribute.module';
import { CustomerModule } from './customer/customer.module';
import { ContactUsLeadsModule } from './contact-us-leads/contact-us-leads.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BannerModule } from './banner/banner.module';
import { CmsSectionModule } from './cms-section/cms-section.module';
import { FooterModule } from './footer/footer.module';
import { UploadModule } from './upload/upload.module';
import { CmsPageModule } from './cms-page/cms-page.module';
import { HeaderModule } from './header/header.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { renameProductImageUrlColumns } from './commonServices/rename-product-image-url';
import { migrateCmsImagesOntoParents } from './commonServices/migrate-cms-images-onto-parents';

// Main application module
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        schema: 'public',
        host: configService.get<string>('DB_HOST'),
        port: parseInt(configService.get<string>('DB_PORT') || '5432', 10),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js,.tsx,.jsx}'],
        synchronize: true,
        autoLoadEntities: true,
        logging: true,
      }),
      dataSourceFactory: async (options) => {
        if (!options) {
          throw new Error('TypeORM options are required');
        }

        // Safety net if main.ts prep was skipped (e.g. tests).
        const prep = new DataSource({
          ...options,
          synchronize: false,
          entities: [],
          migrations: [],
          subscribers: [],
        });
        await prep.initialize();
        try {
          await renameProductImageUrlColumns(prep);
          await migrateCmsImagesOntoParents(prep);
        } finally {
          await prep.destroy();
        }

        const dataSource = new DataSource(options);
        await dataSource.initialize();
        return dataSource;
      },
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    AttributeModule,
    CategoriesModule,
    ProductsModule,
    UsersModule,
    AuthModule,
    OrdersModule,
    PaymentsModule,
    ReviewsModule,
    SettingsModule,
    ModulesModule,
    RolesModule,
    BlogModule,
    OffersModule,
    BrandsModule,
    FaqModule,
    CouponsModule,
    ProductTagsModule,
    CustomerModule,
    ContactUsLeadsModule,
    BannerModule,
    CmsSectionModule,
    FooterModule,
    UploadModule,
    CmsPageModule,
    HeaderModule,
    DashboardModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

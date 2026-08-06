import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/commonServices/common.module';
import { ContactUsLead } from 'src/entities/contact/contact-us-lead.entity';
import { ContactUsLeadsController } from './contact-us-leads.controller';
import { ContactUsLeadsService } from './contact-us-leads.service';

@Module({
  imports: [TypeOrmModule.forFeature([ContactUsLead]), CommonModule],
  controllers: [ContactUsLeadsController],
  providers: [ContactUsLeadsService],
  exports: [ContactUsLeadsService],
})
export class ContactUsLeadsModule {}

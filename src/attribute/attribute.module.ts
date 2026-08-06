import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttributeService } from './attribute.service';
import { AttributeController } from './attribute.controller';
import { Attribute } from 'src/entities/product/attribute.entity';
import { CommonModule } from 'src/commonServices/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([Attribute]), CommonModule],
  providers: [AttributeService],
  controllers: [AttributeController],
})
export class AttributeModule {}

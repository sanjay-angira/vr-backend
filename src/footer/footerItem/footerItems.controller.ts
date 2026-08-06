import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { FooterItemsService } from './footerItems.service';
import { CreateFooterItemDto, UpdateFooterItemDto } from 'src/dto/footer.dto';

@Controller('footer-items')
export class FooterItemsController {
  constructor(private readonly footerItemsService: FooterItemsService) {}

  @Get()
  findAll() {
    return this.footerItemsService.findAll();
  }

  @Get('section/:sectionId')
  findBySection(@Param('sectionId') sectionId: number) {
    return this.footerItemsService.findBySection(sectionId);
  }

  @Post()
  create(@Body() dto: CreateFooterItemDto) {
    return this.footerItemsService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() dto: UpdateFooterItemDto) {
    return this.footerItemsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.footerItemsService.remove(id);
  }
}

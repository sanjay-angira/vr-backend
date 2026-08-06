import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';

import { FooterSettingsService } from './footerSettings.service';
import { UpdateFooterSettingsDto } from 'src/dto/footer.dto';

@Controller('admin/footer-settings')
export class FooterSettingsController {
  constructor(private readonly footerSettingsService: FooterSettingsService) {}

  @Get()
  findOne() {
    return this.footerSettingsService.findOne();
  }

  @Post()
  create(@Body() dto: UpdateFooterSettingsDto) {
    return this.footerSettingsService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() dto: UpdateFooterSettingsDto) {
    return this.footerSettingsService.update(id, dto);
  }
}

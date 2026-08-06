import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { FooterSocialLinksService } from './footerSocialLinks.service';
import {
  CreateFooterSocialLinkDto,
  UpdateFooterSocialLinkDto,
} from 'src/dto/footer.dto';

@Controller('footer-social-links')
export class FooterSocialLinksController {
  constructor(
    private readonly footerSocialLinksService: FooterSocialLinksService,
  ) {}

  @Get()
  findAll() {
    return this.footerSocialLinksService.findAll();
  }

  @Get('section/:sectionId')
  findBySection(@Param('sectionId') sectionId: number) {
    return this.footerSocialLinksService.findBySection(sectionId);
  }

  @Post()
  create(@Body() dto: CreateFooterSocialLinkDto) {
    return this.footerSocialLinksService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() dto: UpdateFooterSocialLinkDto) {
    return this.footerSocialLinksService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.footerSocialLinksService.remove(id);
  }
}

import { Controller, Get } from '@nestjs/common';
import { FooterPublicService } from './footerPublic.service';

@Controller('footer')
export class FooterPublicController {
  constructor(private readonly footerPublicService: FooterPublicService) {}

  @Get('public')
  getPublicFooter() {
    return this.footerPublicService.getPublicFooter();
  }
}

import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FooterPublicService } from './footerPublic.service';

@ApiTags('Website')
@Controller('footer')
export class FooterPublicController {
  constructor(private readonly footerPublicService: FooterPublicService) {}

  @Get('public')
  @ApiOperation({
    summary: 'Published footer menu list items for the storefront',
  })
  getPublicFooter() {
    return this.footerPublicService.getPublicFooterItems();
  }
}

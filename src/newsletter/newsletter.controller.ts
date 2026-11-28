import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PaginationDto } from 'src/dto/common.dto';
import { SubscribeNewsletterDto } from 'src/dto/newsletter.dto';
import { AdminApi, PublicApi } from 'src/commonServices/admin-api.decorator';
import { NewsletterService } from './newsletter.service';

@ApiTags('Newsletter')
@AdminApi()
@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Post('subscribe')
  @PublicApi()
  @ApiOperation({ summary: 'Subscribe to the newsletter' })
  @ApiBody({ type: SubscribeNewsletterDto })
  async subscribe(@Body() dto: SubscribeNewsletterDto) {
    return this.newsletterService.subscribe(dto);
  }

  @Get('subscribers')
  @ApiOperation({ summary: 'Get newsletter subscribers (admin only)' })
  @ApiQuery({ name: 'pageNumber', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async findSubscribers(@Query() pagination: PaginationDto) {
    return this.newsletterService.findSubscribers(pagination);
  }
}

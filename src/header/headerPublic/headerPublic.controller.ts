import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HeaderPublicService } from './headerPublic.service';

@ApiTags('Website')
@Controller('website')
export class HeaderPublicController {
  constructor(private readonly headerPublicService: HeaderPublicService) {}

  @Get('header')
  @ApiOperation({ summary: 'Get public website header data' })
  getHeader() {
    return this.headerPublicService.getPublicHeader();
  }
}

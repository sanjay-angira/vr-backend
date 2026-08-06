import { Controller, Get, Patch, Body } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HeaderSettingsService } from './headerSettings.service';
import { UpdateHeaderSettingsDto } from 'src/dto/header.dto';

@ApiTags('Admin Header')
@Controller('admin/header')
export class HeaderSettingsController {
  constructor(private readonly headerSettingsService: HeaderSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get header settings' })
  getHeaderSettings() {
    return this.headerSettingsService.getAdminHeaderSettings();
  }

  @Patch()
  @ApiOperation({ summary: 'Update header settings' })
  updateHeaderSettings(@Body() dto: UpdateHeaderSettingsDto) {
    return this.headerSettingsService.updateHeaderSettings(dto);
  }
}

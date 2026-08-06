import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AnnouncementBarsService } from './announcementBars.service';
import {
  CreateAnnouncementBarDto,
  UpdateAnnouncementBarDto,
} from 'src/dto/header.dto';

@ApiTags('Admin Announcement Bars')
@Controller('admin/announcement-bars')
export class AnnouncementBarsController {
  constructor(
    private readonly announcementBarsService: AnnouncementBarsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List announcement bars' })
  findAll() {
    return this.announcementBarsService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create announcement bar' })
  create(@Body() dto: CreateAnnouncementBarDto) {
    return this.announcementBarsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update announcement bar' })
  @ApiParam({ name: 'id', type: Number })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAnnouncementBarDto,
  ) {
    return this.announcementBarsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete announcement bar' })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.announcementBarsService.remove(id);
  }
}

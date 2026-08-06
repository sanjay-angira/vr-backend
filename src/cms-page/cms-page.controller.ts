import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CmsPageService } from './cms-page.service';
import {
  CreateCmsPageDto,
  CmsPageQueryDto,
  UpdateCmsPageDto,
} from '../dto/cms-page.dto';

@ApiTags('CMS Pages')
@Controller('cms-pages')
export class CmsPageController {
  constructor(private readonly cmsPageService: CmsPageService) {}

  @Post()
  @ApiOperation({ summary: 'Create CMS page' })
  create(@Body() dto: CreateCmsPageDto) {
    return this.cmsPageService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all CMS pages' })
  findAll(@Query() query: CmsPageQueryDto) {
    return this.cmsPageService.findAll(query);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get CMS page by slug' })
  @ApiParam({ name: 'slug', type: String })
  findBySlug(@Param('slug') slug: string) {
    return this.cmsPageService.findBySlug(slug, true);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get CMS page by ID' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.cmsPageService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update CMS page' })
  @ApiParam({ name: 'id', type: Number })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCmsPageDto) {
    return this.cmsPageService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete CMS page' })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.cmsPageService.remove(id);
  }
}

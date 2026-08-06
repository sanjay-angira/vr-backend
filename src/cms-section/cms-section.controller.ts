// cms-section.controller.ts

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';

import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { CmsSectionService } from './cms-section.service';

import {
  CreateCmsSectionDto,
  ReorderCmsDto,
  UpdateCmsSectionDto,
} from '../dto/cms-section.dto';

@ApiTags('CMS Sections')
@Controller('cms-sections')
export class CmsSectionController {
  constructor(private readonly cmsSectionService: CmsSectionService) {}

  @Post()
  @ApiOperation({
    summary: 'Create CMS section',
  })
  @ApiBody({
    type: CreateCmsSectionDto,
    examples: {
      sample: {
        summary: 'Create CMS section example',
        value: {
          title: 'Homepage Hero Banner',
          type: 'hero_banner',
          position: 1,
          status: true,

          data: {
            autoplay: true,
            speed: 3000,
          },

          productIds: [1, 2],
          categoryIds: [1, 2],
          blogIds: [1],
          offerIds: [1],
          faqIds: [1],
          bannerIds: [1, 2],
          reviewIds: [1, 2],
        },
      },
    },
  })
  create(
    @Body()
    createCmsSectionDto: CreateCmsSectionDto,
  ) {
    try {
      return this.cmsSectionService.create(createCmsSectionDto);
    } catch (error) {
      throw error;
    }
  }

  @Get()
  @ApiOperation({
    summary: 'Get all CMS sections',
  })
  findAll() {
    try {
      return this.cmsSectionService.findAll();
    } catch (error) {
      throw error;
    }
  }

  @Put('reorder')
  @ApiOperation({
    summary: 'Reorder CMS sections',
  })
  @ApiBody({
    type: ReorderCmsDto,
    examples: {
      sample: {
        summary: 'Reorder example',
        value: {
          sections: [
            {
              id: 2,
              position: 1,
            },
            {
              id: 4,
              position: 2,
            },
            {
              id: 1,
              position: 3,
            },
            {
              id: 3,
              position: 4,
            },
            {
              id: 5,
              position: 5,
            },
          ],
        },
      },
    },
  })
  reorder(@Body() reorderCmsDto: ReorderCmsDto) {
    try {
      return this.cmsSectionService.reorder(reorderCmsDto);
    } catch (error) {
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get CMS section by ID',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: Number,
    example: 1,
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      return this.cmsSectionService.findOne(id);
    } catch (error) {
      throw error;
    }
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update CMS section',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: Number,
    example: 1,
  })
  @ApiBody({
    type: UpdateCmsSectionDto,
    examples: {
      sample: {
        summary: 'Update CMS section example',
        value: {
          title: 'Updated Hero Banner',
          type: 'hero_banner',
          position: 2,
          status: true,

          data: {
            autoplay: false,
            speed: 5000,
          },

          productIds: [3, 4],
          productVariantIds: [3],
          categoryIds: [5],
          blogIds: [2],
          offerIds: [2],
          faqIds: [2],
          bannerIds: [3],
          reviewIds: [3, 4],
        },
      },
    },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    updateCmsSectionDto: UpdateCmsSectionDto,
  ) {
    try {
      return this.cmsSectionService.update(id, updateCmsSectionDto);
    } catch (error) {
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete CMS section',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: Number,
    example: 1,
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    try {
      return this.cmsSectionService.remove(id);
    } catch (error) {
      throw error;
    }
  }
}

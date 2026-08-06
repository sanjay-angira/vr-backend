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

import { BannerService } from './banner.service';
import { CreateBannerDto } from '../dto/banner.dto';
import { UpdateBannerDto } from '../dto/banner.dto';
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';

@Controller('banners')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Post()
  @ApiOperation({
    summary: 'Create banner',
  })
  @ApiBody({
    type: CreateBannerDto,
    examples: {
      sample: {
        summary: 'Create banner example',
        value: {
          title: 'Summer Sale',
          subtitle: 'Up To 50% OFF',
          image: 'summer-sale-banner.jpg',
          mobileImage: 'summer-sale-mobile.jpg',
          bannerLink: '/shop',
          position: 1,
          status: true,
          sectionId: 1,
        },
      },
    },
  })
  create(@Body() createBannerDto: CreateBannerDto) {
    try {
      return this.bannerService.create(createBannerDto);
    } catch (error) {
      throw error;
    }
  }

  @Get()
  findAll() {
    try {
      return this.bannerService.findAll();
    } catch (error) {
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get banner by ID',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: Number,
    example: 1,
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      return this.bannerService.findOne(id);
    } catch (error) {
      throw error;
    }
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update banner by ID',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: Number,
    example: 1,
  })
  @ApiBody({
    type: UpdateBannerDto,
    examples: {
      sample: {
        summary: 'Update banner example',
        value: {
          title: 'Mega Summer Sale',
          subtitle: 'Flat 70% OFF',
          image: 'mega-sale-banner.jpg',
          mobileImage: 'mega-sale-mobile.jpg',
          bannerLink: '/offers',
          position: 2,
          status: true,
          sectionId: 2,
        },
      },
    },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBannerDto: UpdateBannerDto,
  ) {
    try {
      return this.bannerService.update(id, updateBannerDto);
    } catch (error) {
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete banner by ID',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: Number,
    example: 1,
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    try {
      return this.bannerService.remove(id);
    } catch (error) {
      throw error;
    }
  }
}

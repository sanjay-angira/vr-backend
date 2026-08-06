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
import {
  ApiTags,
  ApiBody,
  ApiQuery,
  ApiParam,
  ApiOperation,
} from '@nestjs/swagger';
import { BrandsService } from './brands.service';
import {
  BrandDto,
  CreateBrandDto,
  UpdateBrandDto,
  BrandQueryDto,
} from '../dto/brand.dto';

@ApiTags('Brands')
@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post()
  @ApiOperation({ summary: 'Create brand' })
  @ApiBody({
    type: CreateBrandDto,
    examples: {
      sample: {
        summary: 'Create brand example',
        value: {
          brandName: 'Samsung',
          brandSlug: 'samsung',
          shortDescription: 'Samsung',
          description: '<p>Samsung</p>',
          website: 'https://samsung.com',
          metaTitle: 'Samsung',
          metaDescription: 'Samsung',
          metaKeywords: '',
          logo: 'samsung-logo.png',
          isActive: true,
          categoryIds: [15, 16],
        },
      },
    },
  })
  async create(@Body() createBrandDto: CreateBrandDto) {
    return await this.brandsService.create(createBrandDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all brands' })
  @ApiQuery({ name: 'pageNumber', required: false, type: String })
  @ApiQuery({ name: 'pageSize', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'column', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  async findAll(@Query() query: BrandQueryDto) {
    return await this.brandsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a brand by ID' })
  @ApiParam({ name: 'id', required: true, type: Number })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.brandsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a brand by ID' })
  @ApiParam({ name: 'id', required: true, type: Number })
  @ApiBody({
    type: UpdateBrandDto,
    examples: {
      sample: {
        summary: 'Update brand example',
        value: {
          brandName: 'Samsung Electronics',
          brandSlug: 'samsung-electronics',
          shortDescription: 'Global leader in technology',
          description: '<p>Global leader in technology and innovation</p>',
          website: 'https://samsung.com',
          metaTitle: 'Samsung Electronics',
          metaDescription: 'Global leader in technology and innovation',
          metaKeywords: 'samsung, electronics, technology',
          logo: 'samsung-electronics-logo.png',
          isActive: true,
          categoryIds: [15, 16, 17, 18],
          offerIds: [1, 2, 3, 4],
        },
      },
    },
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBrandDto: UpdateBrandDto,
  ) {
    return await this.brandsService.update(id, updateBrandDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a brand by ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.brandsService.remove(id);
  }
}

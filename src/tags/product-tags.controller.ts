import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductTagsService } from './product-tags.service';
import {
  CreateProductTagDto,
  UpdateProductTagDto,
} from '../dto/product-tag.dto';
import { PaginationDto } from '../dto/common.dto';

@ApiTags('Product Tags')
@Controller('product-tags')
export class ProductTagsController {
  constructor(private readonly tagService: ProductTagsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product tag' })
  @ApiBody({
    type: CreateProductTagDto,
    examples: {
      sample: {
        summary: 'Create product tag example',
        value: {
          tagName: 'Organic',
          tagSlug: 'organic',
          isActive: true,
        },
      },
    },
  })
  async create(@Body() createDto: CreateProductTagDto) {
    return await this.tagService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all product tags' })
  @ApiQuery({ name: 'pageNumber', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'column', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, type: String })
  async findAll(@Query() pagination: PaginationDto) {
    return await this.tagService.findAll(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product tag by ID' })
  @ApiParam({ name: 'id', required: true, type: Number })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.tagService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a product tag' })
  @ApiParam({ name: 'id', required: true, type: Number })
  @ApiBody({
    type: UpdateProductTagDto,
    examples: {
      sample: {
        summary: 'Update product tag example',
        value: {
          tagName: 'Premium Organic',
          tagSlug: 'premium-organic',
        },
      },
    },
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateProductTagDto,
  ) {
    return await this.tagService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product tag' })
  @ApiParam({ name: 'id', required: true, type: Number })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.tagService.remove(id);
  }
}

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
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBody,
  ApiQuery,
  ApiParam,
  ApiOperation,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { Category } from '../entities/productCategory/category.entity';
import { PaginationDto, IdDto } from '../dto/common.dto';
import { CreateCategoryDto, UpdateCategoryDto } from 'src/dto/category.dto';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoryService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiBody({
    type: CreateCategoryDto,
    examples: {
      sample: {
        summary: 'Create category example',
        value: {
          categoryName: 'Incense',
          categorySlug: 'incense',
          shortDescription: 'A variety of incense',
          description: 'A variety of premium organic incense sticks and cones.',
          parentId: 1,
          publishStatus: 'published',
          image: 'https://example.com/images/incense.jpg',
          image3d: 'https://example.com/images/incense-3d.glb',
          video: 'https://example.com/videos/incense-intro.mp4',
          icon: 'https://example.com/icons/incense-icon.svg',
          imageAltText: 'Premium organic incense sticks',
          showOnHomePage: true,
          offerIds: [1, 2],
          seo: {
            metaTitle: 'Premium Organic Incense | Spiritual Store',
            metaDescription:
              'Discover our collection of premium organic incense sticks and cones.',
            metaKeywords: 'incense, organic, spiritual',
            ogTitle: 'Premium Organic Incense',
            ogDescription: 'Shop the best organic incense.',
            ogImage: 'https://example.com/images/incense-og.jpg',
          },
        },
      },
    },
  })
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    return await this.categoryService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiQuery({ name: 'pageNumber', required: false, type: String })
  @ApiQuery({ name: 'pageSize', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'column', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, type: String })
  async findAll(@Query() pagination: PaginationDto) {
    return await this.categoryService.findAll(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a category by ID' })
  @ApiParam({ name: 'id', required: true, type: Number })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.categoryService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a category by ID' })
  @ApiParam({ name: 'id', required: true, type: Number })
  @ApiBody({
    type: UpdateCategoryDto,
    examples: {
      sample: {
        summary: 'Update category example',
        value: {
          categoryName: 'Incense (Updated)',
          categorySlug: 'incense-updated',
          shortDescription: 'Updated short description',
          description: 'Updated full description for incense.',
          isActive: false,
          parentId: 1,
          image: 'https://example.com/images/incense-updated.jpg',
          publishStatus: 'draft',
          image3d: 'https://example.com/images/incense-updated-3d.glb',
          video: 'https://example.com/videos/incense-updated.mp4',
          icon: 'https://example.com/icons/incense-updated.svg',
          imageAltText: 'Updated incense alt text',
          showOnHomePage: false,
          offerIds: [3, 4],
          seo: {
            metaTitle: 'Updated Incense Title',
            metaDescription: 'Updated meta description.',
            metaKeywords: 'updated, incense',
          },
        },
      },
    },
  })
  @ApiOkResponse({ type: Category })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return await this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category by ID' })
  @ApiParam({ name: 'id', required: true, type: Number })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.categoryService.remove(id);
  }

  @Get('next/:parentId')
  @ApiOperation({ summary: 'Get next level of categories' })
  @ApiParam({ name: 'parentId', required: true, type: String })
  async getNext(@Param('parentId') parentId: string) {
    const pid = parentId === 'null' ? null : Number(parentId);
    return this.categoryService.getNextLevel(pid);
  }
}

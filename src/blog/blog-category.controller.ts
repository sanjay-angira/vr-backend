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
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { BlogCategoryService } from './blog-category.service';
import {
  CreateBlogCategoryDto,
  UpdateBlogCategoryDto,
} from '../dto/blog-category-tag.dto';
import { PaginationDto } from 'src/dto/common.dto';

@ApiTags('Blog Categories')
@Controller('blog-categories')
export class BlogCategoryController {
  constructor(private readonly categoryService: BlogCategoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new blog category' })
  async create(@Body() createDto: CreateBlogCategoryDto) {
    return await this.categoryService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all blog categories' })
  @ApiQuery({ name: 'pageNumber', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'column', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, type: String })
  async findAll(@Query() paginationDto: PaginationDto) {
    return await this.categoryService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a blog category by ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.categoryService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a blog category' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateBlogCategoryDto,
  ) {
    return await this.categoryService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a blog category' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.categoryService.remove(id);
    return { message: 'Category deleted successfully' };
  }
}

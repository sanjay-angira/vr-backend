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
import { BlogTagService } from './blog-tag.service';
import {
  CreateBlogTagDto,
  UpdateBlogTagDto,
} from '../dto/blog-category-tag.dto';
import { PaginationDto } from 'src/dto/common.dto';

@ApiTags('Blog Tags')
@Controller('blog-tags')
export class BlogTagController {
  constructor(private readonly tagService: BlogTagService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new blog tag' })
  async create(@Body() createDto: CreateBlogTagDto) {
    return await this.tagService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all blog tags' })
  @ApiQuery({ name: 'pageNumber', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'column', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, type: String })
  async findAll(@Query() paginationDto: PaginationDto) {
    return await this.tagService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a blog tag by ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.tagService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a blog tag' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateBlogTagDto,
  ) {
    return await this.tagService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a blog tag' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.tagService.remove(id);
  }
}

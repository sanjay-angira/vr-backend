import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { BlogService } from './blog.service';
import { CreateBlogDto, UpdateBlogDto } from '../dto/blog.dto';
import { PaginationDto } from '../dto/common.dto';

@ApiTags('Blogs')
@Controller('blogs')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new blog post' })
  @ApiBody({
    type: CreateBlogDto,
    examples: {
      example1: {
        value: {
          title: 'Unlocking the Secrets of Indian Spices',
          slug: 'unlocking-the-secrets-of-indian-spices',
          content:
            '<h1>Introduction</h1><p>Indian spices are known for their rich aroma and health benefits...</p>',
          excerpt:
            'A deep dive into the world of Indian spices and their traditional uses.',
          blogImage: 'https://example.com/images/indian-spices.jpg',
          thumbnailImage: 'https://example.com/images/indian-spices-thumb.jpg',
          blogImageAlt: 'Variety of Indian spices in bowls',
          faqs: [
            {
              question: 'What are the main spices?',
              answer: 'Cumin, Turmeric, Coriander, etc.',
            },
            {
              question: 'Are they organic?',
              answer: 'Yes, our spices are 100% organic.',
            },
          ],
          status: 'published',
          publishedAt: new Date().toISOString(),
          readingTime: 5,
          categoryId: 1,
          tagIds: [1, 2, 3],
          seo: {
            metaTitle: 'Indian Spices Secrets | Spice Project',
            metaDescription:
              'Learn about the most popular Indian spices, their history, and how to use them in your cooking for better health and flavor.',
            canonicalUrl: 'https://yourwebsite.com/blog/indian-spices-secrets',
            focusKeyword: 'Indian spices',
            metaRobots: 'index, follow',
            ogTitle: 'Unlocking the Secrets of Indian Spices',
            ogDescription:
              'Explore the vibrant world of Indian spices with us.',
            ogImage: 'https://example.com/images/og-spices.jpg',
            twitterCard: 'summary_large_image',
            schemaType: 'Article',
          },
          isActive: true,
          isFeatured: true,
        },
      },
    },
  })
  async create(@Body() createBlogDto: CreateBlogDto) {
    return await this.blogService.create(createBlogDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all blog posts with pagination' })
  @ApiQuery({ name: 'pageNumber', required: false, type: String })
  @ApiQuery({ name: 'pageSize', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'column', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, type: String })
  async findAll(@Query() paginationDto: PaginationDto) {
    return await this.blogService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a blog post by ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.blogService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a blog post by ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({
    type: UpdateBlogDto,
    examples: {
      example1: {
        value: {
          title: 'Unlocking the Secrets of Indian Spices',
          slug: 'unlocking-the-secrets-of-indian-spices',
          content:
            '<h1>Introduction</h1><p>Indian spices are known for their rich aroma and health benefits...</p>',
          excerpt:
            'A deep dive into the world of Indian spices and their traditional uses.',
          blogImage: 'https://example.com/images/indian-spices.jpg',
          thumbnailImage: 'https://example.com/images/indian-spices-thumb.jpg',
          blogImageAlt: 'Variety of Indian spices in bowls',
          faqs: [
            {
              question: 'What are the main spices?',
              answer: 'Cumin, Turmeric, Coriander, etc.',
            },
            {
              question: 'Are they organic?',
              answer: 'Yes, our spices are 100% organic.',
            },
          ],
          status: 'published',
          publishedAt: new Date().toISOString(),
          readingTime: 5,
          categoryId: 1,
          tagIds: [1, 2, 3],
          seo: {
            metaTitle: 'Indian Spices Secrets | Spice Project',
            metaDescription:
              'Learn about the most popular Indian spices, their history, and how to use them in your cooking for better health and flavor.',
            canonicalUrl: 'https://yourwebsite.com/blog/indian-spices-secrets',
            focusKeyword: 'Indian spices',
            metaRobots: 'index, follow',
            ogTitle: 'Unlocking the Secrets of Indian Spices',
            ogDescription:
              'Explore the vibrant world of Indian spices with us.',
            ogImage: 'https://example.com/images/og-spices.jpg',
            twitterCard: 'summary_large_image',
            schemaType: 'Article',
          },
        },
      },
    },
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBlogDto: UpdateBlogDto,
  ) {
    return await this.blogService.update(id, updateBlogDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a blog post by ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.blogService.remove(id);
    return { message: 'Blog post deleted successfully' };
  }
}

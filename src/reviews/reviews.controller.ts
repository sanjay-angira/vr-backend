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
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { BulkImportReviewsDto, CreateReviewDto, UpdateReviewDto,  } from '../dto/review.dto';
import { PaginationDto } from '../dto/common.dto';
import { AdminApi, PublicApi } from '../commonServices/admin-api.decorator';

@ApiTags('Reviews')
@AdminApi()
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new review' })
  @ApiBody({
    type: CreateReviewDto,
    examples: {
      example1: {
        summary: 'Example review',
        value: {
          rating: 5,
          comment: 'This product is amazing!',
          productId: 1,
          userId: 1,
          isApproved: true,
          isManual: false,
          userName: null,
        },
      },
    },
  })
  async create(@Body() createReviewDto: CreateReviewDto) {
    return await this.reviewsService.create(createReviewDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reviews' })
  @ApiQuery({ name: 'pageNumber', required: false, type: String })
  @ApiQuery({ name: 'pageSize', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'column', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, type: String })
  async findAll(@Query() paginationDto: PaginationDto) {
    return await this.reviewsService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get review by ID' })
  @ApiParam({ name: 'id', required: true, type: Number, example: 1 })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.reviewsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update review by ID' })
  @ApiParam({ name: 'id', required: true, type: Number })
  @ApiBody({
    type: UpdateReviewDto,
    examples: {
      example1: {
        summary: 'Example review update',
        value: {
          rating: 4,
          comment: 'This product is great!',
          productId: 1,
          userId: null,
          isApproved: true,
          isManual: true,
          userName: 'John Doe',
        },
      },
    },
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    return await this.reviewsService.update(id, updateReviewDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete review by ID' })
  @ApiParam({ name: 'id', required: true, type: Number })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.reviewsService.remove(id);
  }

  @Get('product/:productId')
  @PublicApi()
  @ApiOperation({ summary: 'Get all reviews for a product' })
  @ApiParam({ name: 'productId', required: true, type: Number })
  @ApiQuery({ name: 'pageNumber', required: false, type: String })
  @ApiQuery({ name: 'pageSize', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'column', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, type: String })
  async findByProduct(
    @Param('productId', ParseIntPipe) productId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    return await this.reviewsService.findByProduct(productId, paginationDto);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all reviews by a specific user' })
  @ApiParam({ name: 'userId', required: true, type: Number })
  @ApiQuery({ name: 'PageNumber', required: false, type: Number })
  @ApiQuery({ name: 'PageSize', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'column', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, type: String })
  async findByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    return await this.reviewsService.findByUser(userId, paginationDto);
  }

  @Get('product/:productId/average')
  @PublicApi()
  @ApiOperation({ summary: 'Get average rating for a specific product' })
  @ApiParam({ name: 'productId', required: true, type: Number })
  async getAverageRating(@Param('productId', ParseIntPipe) productId: number) {
    return await this.reviewsService.getAverageRatingByProduct(productId);
  }



  @Post('bulk-import')
  @ApiOperation({ summary: 'Bulk import product reviews' })
  @ApiBody({
    type: BulkImportReviewsDto,
    examples: {
      sample: {
        summary: 'Import reviews for multiple products',
        value: {
          source: 'manual-import',
          fictional: true,
          products: [
            {
              productId: 1,
              reviews: [
                {
                  name: 'Aarav Sharma',
                  rating: 5,
                  comment: 'Excellent quality and beautiful packaging.',
                },
                {
                  name: 'Mira Patel',
                  rating: 4,
                  comment: 'Lovely product; delivery was quick.',
                },
              ],
            },
            {
              productId: 2,
              reviews: [
                {
                  name: 'Rohan Verma',
                  rating: 5,
                  comment: 'The fragrance is wonderful and long-lasting.',
                },
              ],
            },
          ],
        },
      },
    },
  })
  async bulkImport(@Body() dto: BulkImportReviewsDto) {
    return this.reviewsService.bulkImport(dto);
  }
}

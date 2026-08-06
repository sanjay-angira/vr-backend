import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Put,
  ParseIntPipe,
} from '@nestjs/common';
import { FaqService } from './faq.service';
import { CreateFaqDto, UpdateFaqDto } from '../dto/faq.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { IdDto, PaginationDto } from '../dto/common.dto';

@ApiTags('FAQ')
@Controller('faqs')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new FAQ' })
  @ApiBody({
    type: CreateFaqDto,
    examples: {
      example1: {
        summary: 'Example FAQ',
        value: {
          question: 'How do I use this product?',
          answer:
            'You can use this product by following the instructions in the manual.',
          sortOrder: 1,
          isActive: true,
          productId: 1,
        },
      },
    },
  })
  create(@Body() createFaqDto: CreateFaqDto) {
    return this.faqService.create(createFaqDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all FAQs' })
  @ApiQuery({ name: 'pageNumber', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'column', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, type: String })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.faqService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a FAQ by ID' })
  @ApiParam({ name: 'id', required: true, type: Number })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.faqService.findOne(id);
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get all FAQs by product ID' })
  @ApiParam({ name: 'productId', required: true, type: Number })
  findByProductId(@Param('productId', ParseIntPipe) productId: number) {
    return this.faqService.findByProductId(productId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a FAQ by ID' })
  @ApiParam({ name: 'id', required: true, type: Number })
  @ApiBody({
    type: UpdateFaqDto,
    examples: {
      example1: {
        summary: 'Example FAQ Update',
        value: {
          question: 'How do I properly use this product?',
          answer:
            'You can use this product by following the instructions in the manual and watching our tutorial videos.',
          sortOrder: 1,
          isActive: true,
          productId: 1,
        },
      },
    },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFaqDto: UpdateFaqDto,
  ) {
    return this.faqService.update(id, updateFaqDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a FAQ by ID' })
  @ApiParam({ name: 'id', required: true, type: Number })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.faqService.remove(id);
  }
}

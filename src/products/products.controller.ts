import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  Put,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from 'src/dto/product.dto';
import { PaginationDto } from 'src/dto/common.dto';
import { AddProductService } from './addProduct.service';
import { UpdateProductService } from './updateProduct.service';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly addProductService: AddProductService,
    private readonly updateProductService: UpdateProductService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiBody({
    type: CreateProductDto,
    examples: {
      createProduct: {
        summary: 'Create product',
        value: {
          productName: 'Aashirvaad Turmeric Powder 200g',
          productSlug: 'aashirvaad-turmeric-powder-200g',
          publishStatus: 'published',
          shortDescription: 'Premium turmeric powder',
          description: 'Natural turmeric powder for daily cooking',
          isActive: true,
          brandId: 1,
          category: 1,
          productOffers: [1, 2],
          productTags: [1, 2],
          frequentlyBoughtTogether: [3, 4],
          attributes: [{ attributeId: 1 }, { attributeId: 2 }],
          images: [
            {
              url: 'https://cdn.example.com/products/turmeric/front.jpg',
              sortOrder: 1,
            },
            {
              url: 'https://cdn.example.com/products/turmeric/back.jpg',
              sortOrder: 2,
            },
          ],
          variants: [
            {
              name: '200g',
              slug: 'aashirvaad-turmeric-powder-200g-200g',
              price: 199,
              stock: 50,
              sku: 'TUR-200',
            },
          ],
          seo: {
            metaTitle: 'Aashirvaad Turmeric Powder 200g',
            metaDescription: 'Premium turmeric powder for daily cooking',
            metaKeywords: 'turmeric, haldi, spice',
            focusKeyword: 'Aashirvaad Turmeric Powder',
            canonicalUrl: 'https://example.com/aashirvaad-turmeric-powder-200g',
            metaRobots: 'index, follow',
            ogTitle: 'Aashirvaad Turmeric Powder 200g',
            ogDescription: 'Premium turmeric powder for daily cooking',
            ogImage: 'turmeric-200g.jpg',
            twitterCard: 'summary_large_image',
            twitterTitle: 'Aashirvaad Turmeric Powder 200g',
            twitterDescription: 'Premium turmeric powder for daily cooking',
            twitterImage: 'turmeric-200g.jpg',
            schemaType: 'Product',
            breadcrumbsTitle: 'Aashirvaad Turmeric Powder',
            primaryKeywordDensity: '4%',
          },
        },
      },
    },
  })
  async create(@Body() createProductDto: CreateProductDto) {
    return await this.addProductService.create(createProductDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update product by ID' })
  @ApiParam({ name: 'id', required: true, type: Number, example: 1 })
  @ApiBody({
    type: UpdateProductDto,
    examples: {
      updateProduct: {
        summary: 'Update product example',
        value: {
          productName: 'Samsung Galaxy S21 Updated',
          productSlug: 'samsung-galaxy-s21-new',
          publishStatus: 'published',
          shortDescription: 'Updated flagship smartphone',
          description: 'Updated description with better performance details',
          isActive: true,

          brandId: 1,
          category: 1,

          productOffers: [1, 2],
          productTags: [1, 2],
          attributes: [{ attributeId: 1 }, { attributeId: 2 }],
          images: [
            {
              url: 'https://cdn.example.com/products/s21/front-v2.jpg',
              sortOrder: 1,
            },
            {
              url: 'https://cdn.example.com/products/s21/back-v2.jpg',
              sortOrder: 2,
            },
          ],
          variants: [
            {
              id: 1,
              name: '128GB',
              price: 749,
              stock: 40,
              images: [
                {
                  url: 'https://cdn.example.com/products/s21/128-v2.jpg',
                  sortOrder: 1,
                },
              ],
            },
            {
              id: 2,
              name: '256GB',
              price: 849,
              stock: 25,
              images: [
                {
                  url: 'https://cdn.example.com/products/s21/256-v2.jpg',
                  sortOrder: 1,
                },
              ],
            },
            {
              name: '512GB',
              price: 999,
              stock: 15,
              sku: 'SGS21-512',
              images: [
                {
                  url: 'https://cdn.example.com/products/s21/512-v2.jpg',
                  sortOrder: 1,
                },
              ],
            },
          ],

          frequentlyBoughtTogether: [3, 4],

          seo: {
            metaTitle: 'Samsung Galaxy S21 Updated',
            metaDescription:
              'Updated Samsung smartphone with enhanced features',
            metaKeywords: 'samsung, galaxy, smartphone, android',
            canonicalUrl: 'https://example.com/samsung-galaxy-s21-new',
            metaRobots: 'index, follow',
            ogTitle: 'Samsung Galaxy S21 - Updated Version',
            ogDescription: 'Experience next-level performance',
            ogImage: 's21-updated.jpg',
            twitterCard: 'summary_large_image',
            twitterTitle: 'Samsung Galaxy S21 Updated',
            twitterDescription: 'New upgraded smartphone',
            twitterImage: 's21-twitter.jpg',
            schemaType: 'Product',
            breadcrumbsTitle: 'Samsung Galaxy S21',
            primaryKeywordDensity: '4%',
          },
        },
      },
    },
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return await this.updateProductService.update(id, updateProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiQuery({ name: 'pageNumber', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'column', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, type: String })
  async findAll(@Query() paginationDto: PaginationDto) {
    return await this.productsService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({ name: 'id', required: true, type: Number, example: 1 })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.productsService.findOne(id);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: Number, example: 1 })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.productsService.remove(id);
  }
}

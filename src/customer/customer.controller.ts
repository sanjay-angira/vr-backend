import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CustomerService } from './customer.service';
import { CustomerHomepageService } from './customer-homepage.service';
import { CustomerBlogService } from './customer-blog.service';
import { AddToCartDto, UpdateCartDto } from 'src/dto/cart.dto';
import { CheckoutDto } from 'src/dto/checkout.dto';
import { VerifyRazorpayPaymentDto } from 'src/dto/razorpay-payment.dto';
import { StoreProductsQueryDto } from 'src/dto/store-products.dto';
import {
  CreateUserAddressDto,
  UpdateUserAddressDto,
} from 'src/dto/user-address.dto';
import { CustomerAddressService } from './customer-address.service';
import { WishlistMutationDto } from 'src/dto/wishlist.dto';
import { CustomerWishlistService } from './customer-wishlist.service';
import { ApplyCouponDto } from 'src/dto/coupon.dto';
import { AddRecentlyViewedDto } from 'src/dto/recently-viewed.dto';
import { CustomerRecentlyViewedService } from './customer-recently-viewed.service';

@ApiTags('Customer App')
@Controller('customer')
export class CustomerController {
  constructor(
    private readonly customerService: CustomerService,
    private readonly customerHomepageService: CustomerHomepageService,
    private readonly customerBlogService: CustomerBlogService,
    private readonly customerAddressService: CustomerAddressService,
    private readonly customerWishlistService: CustomerWishlistService,
    private readonly customerRecentlyViewedService: CustomerRecentlyViewedService,
  ) {}

  @Get('homepage')
  @ApiOperation({ summary: 'Get homepage CMS sections for website' })
  async getHomepage() {
    return this.customerHomepageService.getHomepage();
  }

  @Get('sitemap')
  @ApiOperation({
    summary:
      'Lightweight product/blog/category slugs for storefront sitemap.xml',
  })
  async getSitemapEntries() {
    return this.customerHomepageService.getSitemapEntries();
  }

  @Get('blogs')
  @ApiOperation({ summary: 'Get published blogs for website' })
  @ApiQuery({ name: 'pageNumber', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'categorySlug', required: false, type: String })
  async getBlogs(
    @Query('pageNumber') pageNumber?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('categorySlug') categorySlug?: string,
  ) {
    return this.customerBlogService.getBlogs({
      pageNumber,
      pageSize,
      search,
      categorySlug,
    });
  }

  @Get('blog-filters')
  @ApiOperation({ summary: 'Get blog filter options (categories)' })
  async getBlogFilters() {
    return this.customerBlogService.getBlogFilters();
  }

  @Get('blog/:slug')
  @ApiOperation({ summary: 'Get published blog details by slug' })
  @ApiParam({ name: 'slug', required: true, type: String })
  async getBlogBySlug(@Param('slug') slug: string) {
    return this.customerBlogService.getBlogBySlug(slug);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all published product categories for website' })
  async getCategories() {
    return this.customerService.getStoreCategories();
  }

  @Get('store-filters')
  @ApiOperation({
    summary: 'Get store filter options (categories, price range, banners)',
  })
  async getStoreFilters() {
    return this.customerService.getStoreFilters();
  }

  @Get('all-products')
  @ApiOperation({
    summary:
      'Get store page products (one card per product; best in-stock lowest-price variant)',
  })
  @ApiQuery({ name: 'pageNumber', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({
    name: 'categoryIds',
    required: false,
    type: String,
    description: 'Comma-separated category ids',
  })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['newest', 'price_asc', 'price_desc', 'name_asc', 'discount_desc'],
  })
  @ApiQuery({ name: 'newArrivals', required: false, type: Boolean })
  @ApiQuery({ name: 'featured', required: false, type: Boolean })
  @ApiQuery({ name: 'bestDeals', required: false, type: Boolean })
  @ApiQuery({ name: 'sectionSlugs', required: false, type: String })
  async getStoreProducts(@Query() query: StoreProductsQueryDto) {
    return this.customerService.getStoreProducts(query);
  }

  @Get('product/:slug')
  @ApiOperation({ summary: 'Get product details by slug for customer app' })
  @ApiParam({
    name: 'slug',
    required: true,
    type: String,
    example: 'samsung-galaxy-s21',
  })
  async getProductBySlug(@Param('slug') slug: string) {
    return this.customerService.getProductBySlug(slug);
  }

  @Post('add-cart-item')
  @ApiOperation({ summary: 'Add item to cart for customer app' })
  @ApiBody({
    type: AddToCartDto,
    examples: {
      example1: {
        summary: 'Add to cart for authenticated user',
        value: {
          userId: 1,
          variationId: 1,
          quantity: 2,
          sessionId: null,
        },
      },
    },
  })
  addCartItem(@Body() dto: AddToCartDto) {
    const userId = dto.userId || null;
    const sessionId = dto.sessionId || null;
    return this.customerService.addCartItem(userId, sessionId, dto);
  }

  @Get('get-cart-items')
  @ApiOperation({ summary: 'Get cart items for customer app' })
  getCartItems(
    @Query('userId') userId?: string,
    @Query('sessionId') sessionId?: string,
  ) {
    const parsedUserId = userId ? parseInt(userId) : null;
    const sessionIdValue = sessionId || null;
    return this.customerService.getCartItems(parsedUserId, sessionIdValue);
  }

  @Put('update-cart-item')
  @ApiOperation({ summary: 'Update cart item for customer app' })
  @ApiBody({
    type: UpdateCartDto,
    examples: {
      example1: {
        summary: 'Update cart item for authenticated user',
        value: {
          userId: 1,
          variationId: 1,
          quantity: 3,
          sessionId: null,
        },
      },
    },
  })
  updateCartItem(@Body() dto: UpdateCartDto) {
    return this.customerService.updateCartItem(dto);
  }

  @Delete('remove-cart-item/:id')
  @ApiOperation({ summary: 'Remove item from cart for customer app' })
  @ApiParam({ name: 'id', required: true, type: Number, example: 1 })
  @ApiQuery({
    name: 'sessionId',
    required: false,
    type: String,
    example: 'abc123-session-id',
  })
  removeCartItem(
    @Param('id') id: number,
    @Query('sessionId') sessionId?: string,
  ) {
    return this.customerService.removeCartItem(id, sessionId || null);
  }

  @Delete('clear-cart')
  @ApiOperation({ summary: 'Clear cart for customer app' })
  @ApiQuery({ name: 'userId', required: false, type: String, example: '1' })
  @ApiQuery({
    name: 'sessionId',
    required: false,
    type: String,
    example: 'abc123-session-id',
  })
  clearCart(
    @Query('userId') userId?: string,
    @Query('sessionId') sessionId?: string,
  ) {
    const parsedUserId = userId ? parseInt(userId) : null;
    return this.customerService.clearCart(parsedUserId, sessionId || null);
  }

  @Get('cart-count')
  @ApiOperation({ summary: 'Get cart item count for customer app' })
  @ApiQuery({ name: 'userId', required: false, type: String, example: '1' })
  getCartCount(
    @Query('userId') userId?: string,
    @Query('sessionId') sessionId?: string,
  ) {
    const parsedUserId = userId ? parseInt(userId) : null;
    return this.customerService.getCartCount(parsedUserId, sessionId || null);
  }

  @Get('addresses')
  @ApiOperation({ summary: 'List saved delivery addresses for a user' })
  @ApiQuery({ name: 'userId', required: true, type: String, example: '1' })
  listAddresses(@Query('userId') userId?: string) {
    const parsedUserId = userId ? parseInt(userId, 10) : NaN;
    return this.customerAddressService.listAddresses(parsedUserId);
  }

  @Post('addresses')
  @ApiOperation({
    summary:
      'Create a saved delivery address (supports relative name / phone / email)',
  })
  @ApiBody({ type: CreateUserAddressDto })
  createAddress(@Body() dto: CreateUserAddressDto) {
    return this.customerAddressService.createAddress(dto);
  }

  @Put('addresses/:id')
  @ApiOperation({ summary: 'Update a saved delivery address' })
  @ApiParam({ name: 'id', required: true, type: Number })
  @ApiBody({ type: UpdateUserAddressDto })
  updateAddress(
    @Param('id') id: string,
    @Body() dto: UpdateUserAddressDto,
  ) {
    return this.customerAddressService.updateAddress(parseInt(id, 10), dto);
  }

  @Delete('addresses/:id')
  @ApiOperation({ summary: 'Delete a saved delivery address' })
  @ApiParam({ name: 'id', required: true, type: Number })
  @ApiQuery({ name: 'userId', required: true, type: String })
  deleteAddress(
    @Param('id') id: string,
    @Query('userId') userId?: string,
  ) {
    const parsedUserId = userId ? parseInt(userId, 10) : NaN;
    return this.customerAddressService.deleteAddress(
      parseInt(id, 10),
      parsedUserId,
    );
  }

  @Put('addresses/:id/default')
  @ApiOperation({ summary: 'Set a saved address as default' })
  @ApiParam({ name: 'id', required: true, type: Number })
  @ApiQuery({ name: 'userId', required: true, type: String })
  setDefaultAddress(
    @Param('id') id: string,
    @Query('userId') userId?: string,
  ) {
    const parsedUserId = userId ? parseInt(userId, 10) : NaN;
    return this.customerAddressService.setDefaultAddress(
      parseInt(id, 10),
      parsedUserId,
    );
  }

  @Get('wishlist')
  @ApiOperation({ summary: 'List wishlist items for a logged-in customer' })
  @ApiQuery({ name: 'userId', required: true, type: String, example: '1' })
  listWishlist(@Query('userId') userId?: string) {
    const parsedUserId = userId ? parseInt(userId, 10) : NaN;
    return this.customerWishlistService.listWishlist(parsedUserId);
  }

  @Get('wishlist/ids')
  @ApiOperation({
    summary: 'List wishlist variation ids (for heart filled state)',
  })
  @ApiQuery({ name: 'userId', required: true, type: String, example: '1' })
  listWishlistIds(@Query('userId') userId?: string) {
    const parsedUserId = userId ? parseInt(userId, 10) : NaN;
    return this.customerWishlistService.listWishlistIds(parsedUserId);
  }

  @Get('wishlist/count')
  @ApiOperation({ summary: 'Get wishlist item count' })
  @ApiQuery({ name: 'userId', required: true, type: String, example: '1' })
  getWishlistCount(@Query('userId') userId?: string) {
    const parsedUserId = userId ? parseInt(userId, 10) : NaN;
    return this.customerWishlistService.getWishlistCount(parsedUserId);
  }

  @Post('wishlist')
  @ApiOperation({ summary: 'Add a product variant to wishlist (idempotent)' })
  @ApiBody({ type: WishlistMutationDto })
  addToWishlist(@Body() dto: WishlistMutationDto) {
    return this.customerWishlistService.addToWishlist(dto);
  }

  @Post('wishlist/toggle')
  @ApiOperation({ summary: 'Toggle a product variant in the wishlist' })
  @ApiBody({ type: WishlistMutationDto })
  toggleWishlist(@Body() dto: WishlistMutationDto) {
    return this.customerWishlistService.toggleWishlist(dto);
  }

  @Delete('wishlist/by-variation/:variationId')
  @ApiOperation({ summary: 'Remove a wishlist item by variation id' })
  @ApiParam({ name: 'variationId', required: true, type: Number })
  @ApiQuery({ name: 'userId', required: true, type: String })
  removeWishlistByVariation(
    @Param('variationId') variationId: string,
    @Query('userId') userId?: string,
  ) {
    const parsedUserId = userId ? parseInt(userId, 10) : NaN;
    return this.customerWishlistService.removeByVariation(
      parseInt(variationId, 10),
      parsedUserId,
    );
  }

  @Delete('wishlist/:id')
  @ApiOperation({ summary: 'Remove a wishlist item by wishlist row id' })
  @ApiParam({ name: 'id', required: true, type: Number })
  @ApiQuery({ name: 'userId', required: true, type: String })
  removeWishlistItem(
    @Param('id') id: string,
    @Query('userId') userId?: string,
  ) {
    const parsedUserId = userId ? parseInt(userId, 10) : NaN;
    return this.customerWishlistService.removeWishlistItem(
      parseInt(id, 10),
      parsedUserId,
    );
  }

  @Post('recently-viewed')
  @ApiOperation({
    summary: 'Record recently viewed product(s) for guest or logged-in customer',
  })
  @ApiBody({ type: AddRecentlyViewedDto })
  addRecentlyViewed(@Body() dto: AddRecentlyViewedDto) {
    return this.customerRecentlyViewedService.addRecentlyViewed(dto);
  }

  @Get('recently-viewed')
  @ApiOperation({
    summary: 'List recently viewed products by userId and/or sessionId',
  })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'sessionId', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  listRecentlyViewed(
    @Query('userId') userId?: string,
    @Query('sessionId') sessionId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.customerRecentlyViewedService.listRecentlyViewed(
      userId,
      sessionId,
      limit,
    );
  }

  @Post('apply-coupon')
  @ApiOperation({ summary: 'Apply a coupon code on cart/checkout' })
  @ApiBody({ type: ApplyCouponDto })
  applyCoupon(@Body() dto: ApplyCouponDto) {
    return this.customerService.applyCoupon(dto);
  }

  @Post('checkout')
  @ApiOperation({ summary: 'Place order from cart (COD / Razorpay online)' })
  @ApiBody({ type: CheckoutDto })
  placeOrder(@Body() dto: CheckoutDto) {
    return this.customerService.placeOrder(dto);
  }

  @Post('payments/razorpay/verify')
  @ApiOperation({ summary: 'Verify Razorpay payment after checkout success' })
  @ApiBody({ type: VerifyRazorpayPaymentDto })
  verifyRazorpayPayment(@Body() dto: VerifyRazorpayPaymentDto) {
    return this.customerService.verifyRazorpayPayment(dto);
  }

  @Post('payments/razorpay/webhook')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Razorpay webhook (payment.captured / payment.failed)',
  })
  razorpayWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature?: string,
  ) {
    const rawBody =
      req.rawBody?.toString('utf8') ||
      (typeof req.body === 'string'
        ? req.body
        : JSON.stringify(req.body || {}));
    return this.customerService.handleRazorpayWebhook(rawBody, signature);
  }

  @Get('orders')
  @ApiOperation({ summary: 'List orders for a logged-in customer' })
  @ApiQuery({ name: 'userId', required: true, type: String, example: '1' })
  getUserOrders(@Query('userId') userId?: string) {
    const parsedUserId = userId ? parseInt(userId, 10) : NaN;
    return this.customerService.getUserOrders(parsedUserId);
  }

  @Get('order/:orderNumber')
  @ApiOperation({ summary: 'Get order details by order number' })
  @ApiParam({ name: 'orderNumber', required: true, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'sessionId', required: false, type: String })
  getOrderByNumber(
    @Param('orderNumber') orderNumber: string,
    @Query('userId') userId?: string,
    @Query('sessionId') sessionId?: string,
  ) {
    const parsedUserId = userId ? parseInt(userId) : null;
    return this.customerService.getOrderByNumber(
      orderNumber,
      parsedUserId,
      sessionId || null,
    );
  }
}

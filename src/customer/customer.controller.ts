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
import { CustomerApi } from 'src/commonServices/admin-api.decorator';

type CustomerRequest = Request & { customerId?: number };
type AuthenticatedCustomerRequest = Request & { customerId: number };

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

  @Get('banners')
  @ApiOperation({ summary: 'Get active banners for the storefront homepage' })
  async getHomepageBanners() {
    return this.customerHomepageService.getHomepageBanners();
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

  @Get('search')
  @ApiOperation({
    summary: 'Header autocomplete: matching published products and categories',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    type: String,
    description: 'Search text (product name/slug and category name/slug)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Max products and categories to return (default 8, max 20)',
  })
  async searchStore(@Query('q') q?: string, @Query('limit') limit?: string) {
    return this.customerService.searchStore(q, limit);
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
    name: 'minRating',
    required: false,
    type: Number,
    description: 'Minimum average approved rating (1–5)',
  })
  @ApiQuery({
    name: 'minDiscount',
    required: false,
    type: Number,
    description:
      'Minimum applied offer discount percentage (10, 20, 30, 40, 50)',
  })
  @ApiQuery({
    name: 'offerIds',
    required: false,
    type: String,
    description: 'Comma-separated offer ids',
  })
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
  @CustomerApi({ allowGuest: true })
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
  addCartItem(@Req() req: CustomerRequest, @Body() dto: AddToCartDto) {
    const userId = req.customerId || dto.userId || null;
    if (userId) dto.userId = userId;
    const sessionId = dto.sessionId || null;
    return this.customerService.addCartItem(userId, sessionId, dto);
  }

  @Get('get-cart-items')
  @CustomerApi({ allowGuest: true })
  @ApiOperation({ summary: 'Get cart items for customer app' })
  getCartItems(
    @Req() req: CustomerRequest,
    @Query('userId') userId?: string,
    @Query('sessionId') sessionId?: string,
  ) {
    const parsedUserId = req.customerId || (userId ? parseInt(userId) : null);
    const sessionIdValue = sessionId || null;
    return this.customerService.getCartItems(parsedUserId, sessionIdValue);
  }

  @Put('update-cart-item')
  @CustomerApi({ allowGuest: true })
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
  updateCartItem(@Req() req: CustomerRequest, @Body() dto: UpdateCartDto) {
    if (req.customerId) dto.userId = req.customerId;
    return this.customerService.updateCartItem(dto);
  }

  @Delete('remove-cart-item/:id')
  @CustomerApi({ allowGuest: true })
  @ApiOperation({ summary: 'Remove item from cart for customer app' })
  @ApiParam({ name: 'id', required: true, type: Number, example: 1 })
  @ApiQuery({
    name: 'sessionId',
    required: false,
    type: String,
    example: 'abc123-session-id',
  })
  removeCartItem(
    @Req() req: CustomerRequest,
    @Param('id') id: number,
    @Query('userId') userId?: string,
    @Query('sessionId') sessionId?: string,
  ) {
    const parsedUserId = req.customerId || (userId ? parseInt(userId, 10) : null);
    return this.customerService.removeCartItem(
      id,
      sessionId || null,
      parsedUserId,
    );
  }

  @Delete('clear-cart')
  @CustomerApi({ allowGuest: true })
  @ApiOperation({ summary: 'Clear cart for customer app' })
  @ApiQuery({ name: 'userId', required: false, type: String, example: '1' })
  @ApiQuery({
    name: 'sessionId',
    required: false,
    type: String,
    example: 'abc123-session-id',
  })
  clearCart(
    @Req() req: CustomerRequest,
    @Query('userId') userId?: string,
    @Query('sessionId') sessionId?: string,
  ) {
    const parsedUserId = req.customerId || (userId ? parseInt(userId) : null);
    return this.customerService.clearCart(parsedUserId, sessionId || null);
  }

  @Get('cart-count')
  @CustomerApi({ allowGuest: true })
  @ApiOperation({ summary: 'Get cart item count for customer app' })
  @ApiQuery({ name: 'userId', required: false, type: String, example: '1' })
  getCartCount(
    @Req() req: CustomerRequest,
    @Query('userId') userId?: string,
    @Query('sessionId') sessionId?: string,
  ) {
    const parsedUserId = req.customerId || (userId ? parseInt(userId) : null);
    return this.customerService.getCartCount(parsedUserId, sessionId || null);
  }

  @Get('addresses')
  @CustomerApi()
  @ApiOperation({ summary: 'List saved delivery addresses for a user' })
  @ApiQuery({ name: 'userId', required: false, type: String, example: '1' })
  listAddresses(@Req() req: AuthenticatedCustomerRequest) {
    return this.customerAddressService.listAddresses(req.customerId);
  }

  @Post('addresses')
  @CustomerApi()
  @ApiOperation({
    summary:
      'Create a saved delivery address (supports relative name / phone / email)',
  })
  @ApiBody({ type: CreateUserAddressDto })
  createAddress(
    @Req() req: AuthenticatedCustomerRequest,
    @Body() dto: CreateUserAddressDto,
  ) {
    dto.userId = req.customerId;
    return this.customerAddressService.createAddress(dto);
  }

  @Put('addresses/:id')
  @CustomerApi()
  @ApiOperation({ summary: 'Update a saved delivery address' })
  @ApiParam({ name: 'id', required: true, type: Number })
  @ApiBody({ type: UpdateUserAddressDto })
  updateAddress(
    @Req() req: AuthenticatedCustomerRequest,
    @Param('id') id: string,
    @Body() dto: UpdateUserAddressDto,
  ) {
    dto.userId = req.customerId;
    return this.customerAddressService.updateAddress(parseInt(id, 10), dto);
  }

  @Delete('addresses/:id')
  @CustomerApi()
  @ApiOperation({ summary: 'Delete a saved delivery address' })
  @ApiParam({ name: 'id', required: true, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: String })
  deleteAddress(
    @Req() req: AuthenticatedCustomerRequest,
    @Param('id') id: string,
  ) {
    return this.customerAddressService.deleteAddress(
      parseInt(id, 10),
      req.customerId,
    );
  }

  @Put('addresses/:id/default')
  @CustomerApi()
  @ApiOperation({ summary: 'Set a saved address as default' })
  @ApiParam({ name: 'id', required: true, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: String })
  setDefaultAddress(
    @Req() req: AuthenticatedCustomerRequest,
    @Param('id') id: string,
  ) {
    return this.customerAddressService.setDefaultAddress(
      parseInt(id, 10),
      req.customerId,
    );
  }

  @Get('wishlist')
  @CustomerApi()
  @ApiOperation({ summary: 'List wishlist items for a logged-in customer' })
  @ApiQuery({ name: 'userId', required: false, type: String, example: '1' })
  listWishlist(@Req() req: AuthenticatedCustomerRequest) {
    return this.customerWishlistService.listWishlist(req.customerId);
  }

  @Get('wishlist/ids')
  @CustomerApi()
  @ApiOperation({
    summary: 'List wishlist variation ids (for heart filled state)',
  })
  @ApiQuery({ name: 'userId', required: false, type: String, example: '1' })
  listWishlistIds(@Req() req: AuthenticatedCustomerRequest) {
    return this.customerWishlistService.listWishlistIds(req.customerId);
  }

  @Get('wishlist/count')
  @CustomerApi()
  @ApiOperation({ summary: 'Get wishlist item count' })
  @ApiQuery({ name: 'userId', required: false, type: String, example: '1' })
  getWishlistCount(@Req() req: AuthenticatedCustomerRequest) {
    return this.customerWishlistService.getWishlistCount(req.customerId);
  }

  @Post('wishlist')
  @CustomerApi()
  @ApiOperation({ summary: 'Add a product variant to wishlist (idempotent)' })
  @ApiBody({ type: WishlistMutationDto })
  addToWishlist(
    @Req() req: AuthenticatedCustomerRequest,
    @Body() dto: WishlistMutationDto,
  ) {
    dto.userId = req.customerId;
    return this.customerWishlistService.addToWishlist(dto);
  }

  @Post('wishlist/toggle')
  @CustomerApi()
  @ApiOperation({ summary: 'Toggle a product variant in the wishlist' })
  @ApiBody({ type: WishlistMutationDto })
  toggleWishlist(
    @Req() req: AuthenticatedCustomerRequest,
    @Body() dto: WishlistMutationDto,
  ) {
    dto.userId = req.customerId;
    return this.customerWishlistService.toggleWishlist(dto);
  }

  @Delete('wishlist/by-variation/:variationId')
  @CustomerApi()
  @ApiOperation({ summary: 'Remove a wishlist item by variation id' })
  @ApiParam({ name: 'variationId', required: true, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: String })
  removeWishlistByVariation(
    @Req() req: AuthenticatedCustomerRequest,
    @Param('variationId') variationId: string,
  ) {
    return this.customerWishlistService.removeByVariation(
      parseInt(variationId, 10),
      req.customerId,
    );
  }

  @Delete('wishlist/:id')
  @CustomerApi()
  @ApiOperation({ summary: 'Remove a wishlist item by wishlist row id' })
  @ApiParam({ name: 'id', required: true, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: String })
  removeWishlistItem(
    @Req() req: AuthenticatedCustomerRequest,
    @Param('id') id: string,
  ) {
    return this.customerWishlistService.removeWishlistItem(
      parseInt(id, 10),
      req.customerId,
    );
  }

  @Post('recently-viewed')
  @CustomerApi({ allowGuest: true })
  @ApiOperation({
    summary:
      'Record recently viewed product(s) for guest or logged-in customer',
  })
  @ApiBody({ type: AddRecentlyViewedDto })
  addRecentlyViewed(
    @Req() req: CustomerRequest,
    @Body() dto: AddRecentlyViewedDto,
  ) {
    if (req.customerId) dto.userId = req.customerId;
    return this.customerRecentlyViewedService.addRecentlyViewed(dto);
  }

  @Get('recently-viewed')
  @CustomerApi({ allowGuest: true })
  @ApiOperation({
    summary: 'List recently viewed products by userId and/or sessionId',
  })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'sessionId', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  listRecentlyViewed(
    @Req() req: CustomerRequest,
    @Query('userId') userId?: string,
    @Query('sessionId') sessionId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.customerRecentlyViewedService.listRecentlyViewed(
      req.customerId ? String(req.customerId) : userId,
      sessionId,
      limit,
    );
  }

  @Post('apply-coupon')
  @CustomerApi({ allowGuest: true })
  @ApiOperation({ summary: 'Apply a coupon code on cart/checkout' })
  @ApiBody({ type: ApplyCouponDto })
  applyCoupon(@Req() req: CustomerRequest, @Body() dto: ApplyCouponDto) {
    if (req.customerId) dto.userId = req.customerId;
    return this.customerService.applyCoupon(dto);
  }

  @Post('checkout')
  @CustomerApi({ allowGuest: true })
  @ApiOperation({ summary: 'Place order from cart (COD / Razorpay online)' })
  @ApiBody({ type: CheckoutDto })
  placeOrder(@Req() req: CustomerRequest, @Body() dto: CheckoutDto) {
    if (req.customerId) dto.userId = req.customerId;
    return this.customerService.placeOrder(dto);
  }

  @Post('payments/razorpay/verify')
  @CustomerApi({ allowGuest: true })
  @ApiOperation({ summary: 'Verify Razorpay payment after checkout success' })
  @ApiBody({ type: VerifyRazorpayPaymentDto })
  verifyRazorpayPayment(
    @Req() req: CustomerRequest,
    @Body() dto: VerifyRazorpayPaymentDto,
  ) {
    if (req.customerId) dto.userId = req.customerId;
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
  @CustomerApi()
  @ApiOperation({ summary: 'List orders for a logged-in customer' })
  @ApiQuery({ name: 'userId', required: false, type: String, example: '1' })
  getUserOrders(@Req() req: AuthenticatedCustomerRequest) {
    return this.customerService.getUserOrders(req.customerId);
  }

  @Get('order/:orderNumber')
  @CustomerApi({ allowGuest: true })
  @ApiOperation({ summary: 'Get order details by order number' })
  @ApiParam({ name: 'orderNumber', required: true, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'sessionId', required: false, type: String })
  getOrderByNumber(
    @Req() req: CustomerRequest,
    @Param('orderNumber') orderNumber: string,
    @Query('userId') userId?: string,
    @Query('sessionId') sessionId?: string,
  ) {
    const parsedUserId = req.customerId || (userId ? parseInt(userId, 10) : null);
    return this.customerService.getOrderByNumber(
      orderNumber,
      parsedUserId,
      sessionId || null,
    );
  }

  @Post('reviews')
  @CustomerApi()
  @ApiOperation({ summary: 'Submit a product review (pending approval)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['productId', 'rating', 'comment'],
      properties: {
        productId: { type: 'number', example: 1 },
        rating: { type: 'number', example: 5 },
        comment: {
          type: 'string',
          example: 'Great quality and fast delivery.',
        },
      },
    },
  })
  createReview(
    @Req() req: AuthenticatedCustomerRequest,
    @Body()
    body: {
      productId?: number;
      userId?: number;
      rating?: number;
      comment?: string;
    },
  ) {
    return this.customerService.createCustomerReview({
      productId: Number(body.productId),
      userId: req.customerId,
      rating: Number(body.rating),
      comment: String(body.comment || ''),
    });
  }
}

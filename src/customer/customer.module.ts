import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/commonServices/common.module';
import { Product } from 'src/entities/product/product.entity';
import { Category } from 'src/entities/productCategory/category.entity';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { CustomerHomepageService } from './customer-homepage.service';
import { CartItem } from 'src/entities/cart/cart-item.entity';
import { Cart } from 'src/entities/cart/cart.entity';
import { ProductVariant } from 'src/entities/product/product-variants.entity';
import { CustomerAuthController } from './customerAuth.controller';
import { CustomerAuthService } from './customerAuth.service';
import { User } from 'src/entities/user/user.entity';
import { Visitor } from 'src/entities/user/visitors.entity';
import { CmsSection } from 'src/entities/CMS/cmsSettings.entity';
import { BlogPost } from 'src/entities/blog/blog-posts.entity';
import { BlogCategory } from 'src/entities/blog/blog-category.entity';
import { Banner } from 'src/entities/CMS/banner.entity';
import { Review } from 'src/entities/product/review.entity';
import { CustomerBlogService } from './customer-blog.service';
import { Order } from 'src/entities/order/order.entity';
import { OrderItem } from 'src/entities/order/order-item.entity';
import { UserAddress } from 'src/entities/user/userAddress.entity';
import { CustomerAddressService } from './customer-address.service';
import { WishlistItem } from 'src/entities/wishlist/wishlist-item.entity';
import { CustomerWishlistService } from './customer-wishlist.service';
import { Coupon } from 'src/entities/user/coupon.entity';
import { RecentlyViewed } from 'src/entities/recently-viewed/recently-viewed.entity';
import { CustomerRecentlyViewedService } from './customer-recently-viewed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductVariant,
      Category,
      Cart,
      CartItem,
      User,
      Visitor,
      CmsSection,
      BlogPost,
      BlogCategory,
      Banner,
      Review,
      Order,
      OrderItem,
      UserAddress,
      WishlistItem,
      Coupon,
      RecentlyViewed,
    ]),
    CommonModule,
  ],
  controllers: [CustomerController, CustomerAuthController],
  providers: [
    CustomerService,
    CustomerAuthService,
    CustomerHomepageService,
    CustomerBlogService,
    CustomerAddressService,
    CustomerWishlistService,
    CustomerRecentlyViewedService,
  ],
})
export class CustomerModule {}

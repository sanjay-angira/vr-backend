import {
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { successResponse } from 'src/commonServices/response.service';
import { Order } from 'src/entities/order/order.entity';
import { Product } from 'src/entities/product/product.entity';
import { ProductVariant } from 'src/entities/product/product-variants.entity';
import { User } from 'src/entities/user/user.entity';

const LOW_STOCK_THRESHOLD = 10;

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private monthBounds(offsetMonths: number) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() + offsetMonths, 1);
    const end = new Date(
      now.getFullYear(),
      now.getMonth() + offsetMonths + 1,
      1,
    );
    return { start, end };
  }

  private percentChange(current: number, previous: number) {
    if (previous <= 0) {
      if (current <= 0) {
        return { change: '0%', trend: 'up' as const, changeValue: 0 };
      }
      return { change: '+100%', trend: 'up' as const, changeValue: 100 };
    }

    const value = ((current - previous) / previous) * 100;
    const rounded = Math.round(value * 10) / 10;
    const sign = rounded > 0 ? '+' : '';
    return {
      change: `${sign}${rounded}%`,
      trend: rounded >= 0 ? ('up' as const) : ('down' as const),
      changeValue: rounded,
    };
  }

  private formatInr(value: number) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);
  }

  /** Revenue / order counts exclude cancelled orders. */
  private async sumRevenueBetween(start: Date, end: Date) {
    const result = await this.orderRepository
      .createQueryBuilder('ord')
      .select('COALESCE(SUM(ord.total), 0)', 'total')
      .where('ord.orderStatus != :cancelled', { cancelled: 'cancelled' })
      .andWhere('ord.createdAt >= :start', { start })
      .andWhere('ord.createdAt < :end', { end })
      .getRawOne<{ total: string }>();

    return Number(result?.total) || 0;
  }

  private async countOrdersBetween(start: Date, end: Date) {
    return this.orderRepository
      .createQueryBuilder('ord')
      .where('ord.createdAt >= :start', { start })
      .andWhere('ord.createdAt < :end', { end })
      .getCount();
  }

  private async countCustomersBetween(start: Date, end: Date) {
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.phoneNumber IS NOT NULL')
      .andWhere('user.createdAt >= :start', { start })
      .andWhere('user.createdAt < :end', { end })
      .getCount();
  }

  private async countProductsBetween(start: Date, end: Date) {
    return this.productRepository
      .createQueryBuilder('product')
      .where('product.createdAt >= :start', { start })
      .andWhere('product.createdAt < :end', { end })
      .getCount();
  }

  private async getSalesSeries(months = 6) {
    const { start } = this.monthBounds(-(months - 1));

    const rows = await this.orderRepository
      .createQueryBuilder('ord')
      .select(`EXTRACT(YEAR FROM ord.createdAt)`, 'year')
      .addSelect(`EXTRACT(MONTH FROM ord.createdAt)`, 'month')
      .addSelect('COALESCE(SUM(ord.total), 0)', 'value')
      .where('ord.orderStatus != :cancelled', { cancelled: 'cancelled' })
      .andWhere('ord.createdAt >= :start', { start })
      .groupBy('EXTRACT(YEAR FROM ord.createdAt)')
      .addGroupBy('EXTRACT(MONTH FROM ord.createdAt)')
      .getRawMany<{ year: string; month: string; value: string }>();

    const byKey = new Map(
      rows.map((row) => {
        const year = Number(row.year);
        const month = Number(row.month);
        const key = `${year}-${String(month).padStart(2, '0')}`;
        return [key, Number(row.value) || 0] as const;
      }),
    );

    const series: Array<{ label: string; value: number; monthKey: string }> =
      [];

    for (let i = months - 1; i >= 0; i -= 1) {
      const { start: monthStart } = this.monthBounds(-i);
      const year = monthStart.getFullYear();
      const month = monthStart.getMonth() + 1;
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;
      const label = monthStart.toLocaleString('en-US', { month: 'short' });
      series.push({
        monthKey,
        label,
        value: byKey.get(monthKey) || 0,
      });
    }

    return series;
  }

  private async getLowStock(limit = 8) {
    const variants = await this.variantRepository
      .createQueryBuilder('variant')
      .leftJoinAndSelect('variant.product', 'product')
      .where('variant.stock <= :threshold', { threshold: LOW_STOCK_THRESHOLD })
      .orderBy('variant.stock', 'ASC')
      .addOrderBy('variant.updatedAt', 'DESC')
      .take(limit)
      .getMany();

    return variants.map((variant) => ({
      id: variant.id,
      variantId: variant.id,
      productId: variant.product?.id ?? null,
      productName: variant.product?.productName || '—',
      variantName: variant.name || '—',
      name:
        [variant.product?.productName, variant.name]
          .filter(Boolean)
          .join(' · ') || variant.name,
      sku: variant.sku || '—',
      stock: Number(variant.stock) || 0,
      threshold: LOW_STOCK_THRESHOLD,
    }));
  }

  private async getRecentOrders(limit = 5) {
    const orders = await this.orderRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return orders.map((order) => {
      const shipping =
        order.shippingAddress && typeof order.shippingAddress === 'object'
          ? order.shippingAddress
          : null;

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: shipping?.fullName || '—',
        total: Number(order.total) || 0,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
      };
    });
  }

  async getSummary() {
    const thisMonth = this.monthBounds(0);
    const lastMonth = this.monthBounds(-1);

    const [
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalProducts,
      thisMonthRevenue,
      lastMonthRevenue,
      thisMonthOrders,
      lastMonthOrders,
      thisMonthCustomers,
      lastMonthCustomers,
      thisMonthProducts,
      lastMonthProducts,
      salesSeries,
      lowStock,
      recentOrders,
    ] = await Promise.all([
      this.orderRepository
        .createQueryBuilder('ord')
        .select('COALESCE(SUM(ord.total), 0)', 'total')
        .where('ord.orderStatus != :cancelled', { cancelled: 'cancelled' })
        .getRawOne<{ total: string }>()
        .then((row) => Number(row?.total) || 0),
      this.orderRepository.count(),
      this.userRepository
        .createQueryBuilder('user')
        .where('user.phoneNumber IS NOT NULL')
        .getCount(),
      this.productRepository.count(),
      this.sumRevenueBetween(thisMonth.start, thisMonth.end),
      this.sumRevenueBetween(lastMonth.start, lastMonth.end),
      this.countOrdersBetween(thisMonth.start, thisMonth.end),
      this.countOrdersBetween(lastMonth.start, lastMonth.end),
      this.countCustomersBetween(thisMonth.start, thisMonth.end),
      this.countCustomersBetween(lastMonth.start, lastMonth.end),
      this.countProductsBetween(thisMonth.start, thisMonth.end),
      this.countProductsBetween(lastMonth.start, lastMonth.end),
      this.getSalesSeries(6),
      this.getLowStock(8),
      this.getRecentOrders(5),
    ]);

    const revenueChange = this.percentChange(thisMonthRevenue, lastMonthRevenue);
    const ordersChange = this.percentChange(thisMonthOrders, lastMonthOrders);
    const customersChange = this.percentChange(
      thisMonthCustomers,
      lastMonthCustomers,
    );
    const productsChange = this.percentChange(
      thisMonthProducts,
      lastMonthProducts,
    );

    const salesMax = Math.max(...salesSeries.map((row) => row.value), 0);
    const salesChange = this.percentChange(
      salesSeries[salesSeries.length - 1]?.value || 0,
      salesSeries[salesSeries.length - 2]?.value || 0,
    );

    return successResponse(
      {
        stats: {
          revenue: {
            value: totalRevenue,
            label: this.formatInr(totalRevenue),
            ...revenueChange,
          },
          orders: {
            value: totalOrders,
            label: String(totalOrders),
            ...ordersChange,
          },
          customers: {
            value: totalCustomers,
            label: String(totalCustomers),
            ...customersChange,
          },
          products: {
            value: totalProducts,
            label: String(totalProducts),
            ...productsChange,
          },
        },
        sales: {
          series: salesSeries,
          maxValue: salesMax,
          change: salesChange.change,
          trend: salesChange.trend,
        },
        lowStock,
        recentOrders,
        lowStockThreshold: LOW_STOCK_THRESHOLD,
      },
      'Dashboard summary fetched successfully',
      HttpStatus.OK,
    );
  }
}

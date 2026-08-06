import {
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from 'src/dto/common.dto';
import { successResponse } from 'src/commonServices/response.service';
import { UtilityService } from 'src/commonServices/utility.service';
import { Order } from 'src/entities/order/order.entity';
import { OrderItem } from 'src/entities/order/order-item.entity';
import { OrderShippingAddress } from 'src/entities/order/order-shipping-address';

type OrderListEntity = Order & { itemCount?: number };

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    private readonly utilityService: UtilityService,
  ) {}

  private resolveShipping(order: Order): OrderShippingAddress {
    if (order.shippingAddress && typeof order.shippingAddress === 'object') {
      return order.shippingAddress;
    }

    return {
      fullName: '',
      phone: '',
      email: null,
      addressLine1: '',
      addressLine2: null,
      city: '',
      state: '',
      pincode: '',
    };
  }

  private mapListRow(order: OrderListEntity) {
    const shipping = this.resolveShipping(order);

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: shipping.fullName || '—',
      phone: shipping.phone || '—',
      email: shipping.email || null,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      total: Number(order.total) || 0,
      itemCount: Number(order.itemCount) || 0,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  private mapOrderDetail(order: Order, items: OrderItem[]) {
    const shipping = this.resolveShipping(order);
    const couponJson =
      order.couponJson && typeof order.couponJson === 'object'
        ? order.couponJson
        : null;
    const listSubtotal = Number(order.listSubtotal ?? order.subtotal);
    const discountTotal = Number(order.discountTotal ?? 0);
    const couponDiscount = Number(
      order.couponDiscount ?? couponJson?.couponDiscount ?? 0,
    );
    const offerDiscountFromItems = items.reduce((sum, row) => {
      const qty = Number(row.quantity) || 0;
      const perUnit = Number(row.discountAmount ?? 0);
      if (perUnit > 0) return sum + perUnit * qty;
      const list = Number(row.listUnitPrice ?? row.unitPrice) || 0;
      const unit = Number(row.unitPrice) || 0;
      return sum + Math.max(0, list - unit) * qty;
    }, 0);
    const offerDiscountTotal = Number(
      Math.max(0, discountTotal - couponDiscount) > 0
        ? Math.max(0, discountTotal - couponDiscount)
        : offerDiscountFromItems,
    );
    const couponId =
      couponJson?.id != null ? Number(couponJson.id) : null;
    const couponCode =
      couponJson?.couponCode != null ? String(couponJson.couponCode) : null;
    const couponDiscountType =
      couponJson?.discountType != null
        ? String(couponJson.discountType)
        : null;
    const couponDiscountValue =
      couponJson?.discountValue != null
        ? Number(couponJson.discountValue)
        : null;
    const offers = [
      ...new Map(
        items
          .map((row) =>
            row.offerJson && typeof row.offerJson === 'object'
              ? row.offerJson
              : null,
          )
          .filter((offer): offer is NonNullable<typeof offer> =>
            Boolean(offer?.id || offer?.offerName),
          )
          .map((offer) => [
            String(offer.id ?? offer.offerName),
            {
              id: offer.id,
              offerName: offer.offerName ?? null,
              offerSlug: offer.offerSlug ?? null,
              discountType: offer.discountType ?? null,
              discountValue:
                offer.discountValue != null
                  ? Number(offer.discountValue)
                  : null,
              sources: offer.sources ?? [],
            },
          ]),
      ).values(),
    ];

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      sessionId: order.sessionId,
      orderStatus: order.orderStatus,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      listSubtotal,
      discountTotal,
      offerDiscountTotal,
      couponDiscount,
      couponId,
      couponCode,
      couponDiscountType,
      couponDiscountValue,
      couponJson,
      coupon:
        couponId || couponCode
          ? {
              id: couponId,
              couponCode,
              discountType: couponDiscountType,
              discountValue: couponDiscountValue,
              couponDiscount,
            }
          : null,
      offers,
      subtotal: Number(order.subtotal) || 0,
      shippingFee: Number(order.shippingFee) || 0,
      total: Number(order.total) || 0,
      shippingAddress: shipping,
      customerName: shipping.fullName || '—',
      phone: shipping.phone || '—',
      email: shipping.email || null,
      addressLine1: shipping.addressLine1 || '',
      addressLine2: shipping.addressLine2 || null,
      city: shipping.city || '',
      state: shipping.state || '',
      pincode: shipping.pincode || '',
      notes: order.notes,
      razorpayOrderId: order.razorpayOrderId,
      razorpayPaymentId: order.razorpayPaymentId,
      items: items.map((row) => {
        const offerJson =
          row.offerJson && typeof row.offerJson === 'object'
            ? row.offerJson
            : null;
        const listUnitPrice = Number(row.listUnitPrice ?? row.unitPrice) || 0;
        const quantity = Number(row.quantity) || 0;
        const discountAmount = Number(row.discountAmount ?? 0) || 0;

        return {
          id: row.id,
          productId: row.productId,
          variationId: row.variationId,
          productName: row.productName,
          variantName: row.variantName,
          sku: row.sku,
          quantity,
          listUnitPrice,
          unitPrice: Number(row.unitPrice) || 0,
          discountAmount,
          subtotal: Number(row.subtotal) || 0,
          listSubtotal: listUnitPrice * quantity,
          image: row.image,
          offerJson,
          appliedOffer: offerJson,
        };
      }),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  async findAll(paginationDto: PaginationDto) {
    const {
      pageNumber,
      pageSize,
      search,
      column = 'createdAt',
      order = 'DESC',
    } = paginationDto;

    const queryBuilder = this.orderRepository
      .createQueryBuilder('ord')
      .loadRelationCountAndMap('ord.itemCount', 'ord.items');

    if (this.utilityService.validateSearch(search) && search) {
      queryBuilder.andWhere(
        `(
          ord.orderNumber ILIKE :search
          OR ord.orderStatus ILIKE :search
          OR ord.paymentStatus ILIKE :search
          OR ord.paymentMethod ILIKE :search
          OR ord.shippingAddress->>'fullName' ILIKE :search
          OR ord.shippingAddress->>'phone' ILIKE :search
          OR ord.shippingAddress->>'email' ILIKE :search
          OR ord.shippingAddress->>'city' ILIKE :search
        )`,
        { search: `%${search}%` },
      );
    }

    const validColumns = [
      'id',
      'orderNumber',
      'orderStatus',
      'paymentStatus',
      'paymentMethod',
      'total',
      'createdAt',
      'updatedAt',
    ];
    const orderColumn = validColumns.includes(column) ? column : 'createdAt';
    queryBuilder.orderBy(
      `ord.${orderColumn}`,
      order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC',
    );

    const count = await queryBuilder.getCount();

    if (
      this.utilityService.validatePageNumber(pageNumber) &&
      this.utilityService.validatePageSize(pageSize)
    ) {
      const page = Number(pageNumber);
      const size = Number(pageSize);
      queryBuilder.skip((page - 1) * size).take(size);
    }

    const rows = (await queryBuilder.getMany()) as OrderListEntity[];

    return successResponse(
      {
        rows: rows.map((row) => this.mapListRow(row)),
        count,
      },
      'Orders retrieved successfully',
      HttpStatus.OK,
    );
  }

  async findOne(id: number) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    const items =
      order.items ||
      (await this.orderItemRepository.find({ where: { orderId: order.id } }));

    return successResponse(
      this.mapOrderDetail(order, items),
      'Order retrieved successfully',
      HttpStatus.OK,
    );
  }
}

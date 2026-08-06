import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderItem } from '../order/order-item.entity';
import { OrderShippingAddress } from './order-shipping-address';
import { OrderCouponJson } from './order-coupon-json';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type PaymentMethod = 'cod' | 'online';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 32, unique: true })
  orderNumber!: string;

  @Column({ type: 'int', nullable: true })
  userId!: number | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  sessionId!: string | null;


  @Column({ type: 'jsonb', nullable: true })
  shippingAddress!: OrderShippingAddress | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'cod' })
  paymentMethod!: PaymentMethod;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  paymentStatus!: PaymentStatus;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  orderStatus!: OrderStatus;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  listSubtotal!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discountTotal!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  subtotal!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  shippingFee!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  total!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  couponDiscount!: number;

  @Column({ type: 'jsonb', nullable: true })
  couponJson!: OrderCouponJson | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  razorpayOrderId!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  razorpayPaymentId!: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  razorpaySignature!: string | null;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items!: OrderItem[];

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { OrderItemOfferJson } from './order-item-offer-json';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  orderId!: number;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order!: Order;

  @Column({ type: 'int', nullable: true })
  variationId!: number | null;

  @Column({ type: 'int', nullable: true })
  productId!: number | null;

  @Column({ type: 'varchar', length: 255 })
  productName!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  variantName!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sku!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image!: string | null;

  @Column('int')
  quantity!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  listUnitPrice!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discountAmount!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal!: number;

  @Column({ type: 'jsonb', nullable: true })
  offerJson!: OrderItemOfferJson | null;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;
}

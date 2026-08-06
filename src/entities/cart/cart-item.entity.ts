import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';
import { Cart } from './cart.entity';
import { ProductVariant } from '../product/product-variants.entity';

@Entity('cart_items')
export class CartItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  cartId!: number;

  @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cartId' })
  cart!: Cart;

  @Column()
  variationId!: number;

  @ManyToOne(() => ProductVariant, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variationId' })
  variant!: ProductVariant | null;

  @Column()
  quantity!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  priceAtTime!: number;

  @Column({ type: 'json', nullable: true })
  attributesSnapshot!: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}

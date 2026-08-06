import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  Index,
} from 'typeorm';
import { User } from '../user/user.entity';
import { ProductVariant } from '../product/product-variants.entity';

/**
 * Saved wishlist entries for a logged-in customer.
 * Uniqueness is per user + product variant (same as cart line identity).
 */
@Entity('wishlist_items')
@Unique(['userId', 'variationId'])
@Index(['userId'])
export class WishlistItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  userId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'int' })
  variationId!: number;

  @ManyToOne(() => ProductVariant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variationId' })
  variant!: ProductVariant | null;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}

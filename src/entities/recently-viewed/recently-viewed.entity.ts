import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Product } from '../product/product.entity';

/**
 * Recently viewed products for guests (sessionId) and logged-in customers (userId).
 * Guest rows are merged onto the user when both identities are present on add/list.
 */
@Entity('recently_viewed')
@Index(['userId'])
@Index(['sessionId'])
@Index(['productId'])
export class RecentlyViewed {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', nullable: true })
  userId!: number | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'userId' })
  user!: User | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  sessionId!: string | null;

  @Column({ type: 'int' })
  productId!: number;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product!: Product | null;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}

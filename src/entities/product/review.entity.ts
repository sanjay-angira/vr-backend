import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { User } from '../user/user.entity';
import { CmsSection } from '../CMS/cmsSettings.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  rating!: number;

  @Column({ type: 'varchar', nullable: true })
  comment!: string;

  @Column({ type: 'boolean', default: false })
  isApproved!: boolean;

  @Column({ type: 'boolean', default: false })
  isManual!: boolean;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  product!: Product;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  user!: User | null;

  @Column({ type: 'varchar', nullable: true })
  userName!: string | null;

  @ManyToOne(() => CmsSection, (section) => section.reviews, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  section!: CmsSection | null;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}

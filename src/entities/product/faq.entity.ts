import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { CmsSection } from '../CMS/cmsSettings.entity';

@Entity('faqs')
export class Faq {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', nullable: true })
  question!: string;

  @Column({ type: 'varchar', nullable: true })
  answer!: string;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;

  @Column({ default: true })
  isActive!: boolean;

  @ManyToOne(() => Product, (product) => product.faqs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product!: Product;

  @Column({ nullable: true })
  productId!: number;

  @ManyToOne(() => CmsSection, (section) => section.faqs, {
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

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('product_seo')
@Index('UQ_product_seo_product_id', ['product'], { unique: true })
export class ProductSeo {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => Product, (product) => product.seo, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'varchar', length: 255, nullable: true })
  metaTitle!: string | null;

  @Column({ type: 'text', nullable: true })
  metaDescription!: string | null;

  @Column({ type: 'text', nullable: true })
  metaKeywords!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  focusKeyword!: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  canonicalUrl!: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    default: 'index, follow',
  })
  metaRobots?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ogTitle!: string | null;

  @Column({ type: 'text', nullable: true })
  ogDescription!: string | null;

  @Column({ type: 'text', nullable: true })
  ogImage!: string | null;

  @Column({ type: 'varchar', length: 50, default: 'product' })
  ogType!: string | null;

  @Column({ type: 'varchar', length: 50, default: 'summary_large_image' })
  twitterCard!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  twitterTitle!: string | null;

  @Column({ type: 'text', nullable: true })
  twitterDescription!: string | null;

  @Column({ type: 'text', nullable: true })
  twitterImage!: string | null;

  // 🔹 Structured Data
  @Column({ type: 'varchar', default: 'Product' })
  schemaType!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  schemaData!: Record<string, unknown> | null;

  @Column({ type: 'varchar', nullable: true })
  slug!: string | null; // optional if separate from product slug

  @Column({ type: 'varchar', length: 255, nullable: true })
  breadcrumbsTitle!: string | null;

  @Column({ type: 'varchar', nullable: true })
  primaryKeywordDensity!: string | null;

  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}

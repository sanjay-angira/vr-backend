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
export class ProductSeo {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => Product, (product) => product.seo, { onDelete: 'CASCADE' })
  @JoinColumn()
  product!: Product;

  @Column({ type: 'varchar', nullable: true })
  metaTitle!: string | null;

  @Column({ type: 'varchar', nullable: true })
  metaDescription!: string | null;

  @Column({ type: 'varchar', nullable: true })
  metaKeywords!: string | null;

  @Column({ type: 'varchar', nullable: true })
  focusKeyword!: string | null;

  @Column({ type: 'varchar', nullable: true })
  canonicalUrl!: string | null;

  @Column({ type: 'varchar', nullable: true, default: 'index, follow' })
  metaRobots?: string | null;

  // 🔹 Open Graph (Facebook / WhatsApp)
  @Column({ type: 'varchar', nullable: true })
  ogTitle!: string | null;

  @Column({ type: 'varchar', nullable: true })
  ogDescription!: string | null;

  @Column({ type: 'varchar', nullable: true })
  ogImage!: string | null;

  @Column({ type: 'varchar', default: 'product' })
  ogType!: string | null;

  // 🔹 Twitter Card
  @Column({ type: 'varchar', default: 'summary_large_image' })
  twitterCard!: string | null;

  @Column({ type: 'varchar', nullable: true })
  twitterTitle!: string | null;

  @Column({ type: 'varchar', nullable: true })
  twitterDescription!: string | null;

  @Column({ type: 'varchar', nullable: true })
  twitterImage!: string | null;

  // 🔹 Structured Data
  @Column({ type: 'varchar', default: 'Product' })
  schemaType!: string | null;

  @Column({ type: 'json', nullable: true })
  schemaData!: Record<string, any>;

  @Column({ type: 'varchar', nullable: true })
  slug!: string | null; // optional if separate from product slug

  @Column({ type: 'varchar', nullable: true })
  breadcrumbsTitle!: string | null;

  @Column({ type: 'varchar', nullable: true })
  primaryKeywordDensity!: string | null;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}

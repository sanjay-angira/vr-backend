import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { ProductVariant } from './product-variants.entity';
import { Tags } from './tags.entity';
import { Review } from './review.entity';
import { Category } from '../productCategory/category.entity';
import { Offer } from './offer.entity';
import { Brand } from './brand.entity';
import { Faq } from './faq.entity';
import { ProductSeo } from './product-seo.entity';
import { ProductImage } from './product-images.entity';
import { CmsSection } from '../CMS/cmsSettings.entity';
import { CategoryAttribute } from '../productCategory/category-attribute.entity';
import { ProductAttribute } from './product-attribute.entity';

export enum PublishStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  SCHEDULED = 'scheduled',
}
@Entity('product')
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', nullable: true })
  productName!: string;

  @Column({ type: 'varchar', nullable: true, unique: true })
  productSlug!: string;

  @Column({ type: 'varchar', nullable: true })
  shortDescription!: string | null;

  @Column({ type: 'varchar', nullable: true })
  description!: string | null;

  @Column({ type: 'boolean', default: true, nullable: false })
  isActive!: boolean;

  @Column({ type: 'enum', enum: PublishStatus, default: PublishStatus.DRAFT })
  publishStatus!: PublishStatus;

  @ManyToOne(() => Category, { eager: true })
  category!: Category;

  @ManyToOne(() => Brand, { eager: true, nullable: true, onDelete: 'CASCADE' })
  brand!: Brand;

  @OneToMany(() => ProductVariant, (variant) => variant.product, {
    cascade: true,
    eager: true,
  })
  variants!: ProductVariant[];

  @ManyToMany(() => Offer, (offer) => offer.products)
  @JoinTable()
  productOffers!: Offer[];

  @OneToMany(() => Tags, (tag) => tag.product, { cascade: true, eager: true })
  productTags!: Tags[];

  @OneToMany(() => ProductImage, (image) => image.product, {
    cascade: true,
    eager: true,
  })
  images!: ProductImage[];

  @OneToOne(() => ProductSeo, (seo) => seo.product, { cascade: true })
  seo!: ProductSeo;

  @ManyToMany(() => Product, (product) => product.relatedTo)
  @JoinTable()
  frequentlyBoughtTogether!: Product[];

  @ManyToMany(() => Product, (product) => product.frequentlyBoughtTogether)
  relatedTo!: Product[];

  @OneToMany(() => Faq, (faq) => faq.product, { cascade: true })
  faqs!: Faq[];

  @OneToMany(() => Review, (review) => review.product, {
    cascade: true,
    eager: true,
  })
  reviews!: Review[];

  /**
   * Legacy single-section FK column. Kept so existing DB links survive
   * synchronize while we backfill into `sections` (ManyToMany).
   * Do not write new assignments here — use `sections`.
   */
  @Column({ name: 'sectionId', type: 'int', nullable: true })
  legacySectionId!: number | null;

  /** Homepage / CMS sections this product belongs to (many-to-many). */
  @ManyToMany(() => CmsSection, (section) => section.products)
  sections!: CmsSection[];

  @OneToMany(() => ProductAttribute, (pa) => pa.product)
  productAttributes!: ProductAttribute[];

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}

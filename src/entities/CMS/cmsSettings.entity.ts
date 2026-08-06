import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Product } from '../product/product.entity';
import { Category } from '../productCategory/category.entity';
import { BlogPost } from '../blog/blog-posts.entity';
import { Offer } from '../product/offer.entity';
import { Faq } from '../product/faq.entity';
import { Banner } from './banner.entity';
import { Review } from '../product/review.entity';

export enum CmsSectionType {
  HERO_BANNER = 'hero_banner',
  NEWSLETTER = 'news_letter',
  PRODUCT_SLIDER = 'product_slider',
  CATEGORY_SLIDER = 'category_slider',
  BLOG_SECTION = 'blog_section',
  OFFER_SECTION = 'offer_section',
  FAQ_SECTION = 'faq_section',
  REVIEW_SECTION = 'review_section',
  CUSTOM = 'custom',
}

@Entity('cms_sections')
export class CmsSection {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ type: 'varchar', length: 160, unique: true, nullable: true })
  slug!: string | null;

  @Column({
    type: 'enum',
    enum: CmsSectionType,
  })
  type!: CmsSectionType;

  @Column({ default: 0 })
  position!: number;

  @Column({ default: true })
  status!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  data!: any;

  @ManyToMany(() => Product, (product) => product.sections, { eager: true })
  @JoinTable({
    name: 'cms_section_products',
    joinColumn: { name: 'cmsSectionId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'productId', referencedColumnName: 'id' },
  })
  products!: Product[];

  @OneToMany(() => Category, (category) => category.section, { eager: true })
  categories!: Category[];

  @OneToMany(() => BlogPost, (blog) => blog.section, { eager: true })
  blogs!: BlogPost[];

  @OneToMany(() => Offer, (offer) => offer.section, { eager: true })
  offers!: Offer[];

  @OneToMany(() => Faq, (faq) => faq.section, { eager: true })
  faqs!: Faq[];

  @OneToMany(() => Banner, (banner) => banner.section, { cascade: true })
  banners!: Banner[];

  @OneToMany(() => Review, (review) => review.section, { cascade: true })
  reviews!: Review[];

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}

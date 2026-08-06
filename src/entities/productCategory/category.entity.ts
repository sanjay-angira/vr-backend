import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CategorySeo } from './category-seo.entity';
import { Offer } from '../product/offer.entity';
import { CategoryAttribute } from './category-attribute.entity';
import { CmsSection } from '../CMS/cmsSettings.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', unique: true, length: 255, nullable: true })
  categoryName!: string;

  @Column({ type: 'varchar', unique: true, length: 255, nullable: true })
  categorySlug!: string;

  @Column({ type: 'varchar', nullable: true })
  shortDescription!: string;

  @Column({ type: 'varchar', nullable: true })
  description!: string;

  @Column({
    type: 'enum',
    enum: ['draft', 'published', 'scheduled'],
    default: 'draft',
  })
  publishStatus!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  image!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  image3d!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  video!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  icon!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  imageAltText!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'boolean', default: false })
  showOnHomePage!: boolean;

  @OneToOne(() => CategorySeo, (seo) => seo.category, {
    cascade: true,
    eager: false,
  })
  seo!: CategorySeo;

  @ManyToOne(() => Category, (cat: Category) => cat.children)
  parent!: Category | null;

  @OneToMany(() => Category, (cat: Category) => cat.parent)
  children!: Category[];

  @OneToMany(() => CategoryAttribute, (ca) => ca.category)
  categoryAttributes!: CategoryAttribute[];

  @ManyToMany(() => Offer, (offer) => offer.categories)
  @JoinTable()
  categoryOffers!: Offer[];

  @ManyToOne(() => CmsSection, (section) => section.categories, {
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

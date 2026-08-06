import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  ManyToOne,
} from 'typeorm';
import { Category } from '../productCategory/category.entity';
import { Product } from './product.entity';
import { ProductVariant } from './product-variants.entity';
import { Brand } from './brand.entity';
import { CmsSection } from '../CMS/cmsSettings.entity';

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

@Entity('offers')
export class Offer {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', nullable: true })
  offerName!: string;

  @Column({ type: 'varchar', nullable: true, unique: true })
  offerSlug!: string;

  @Column({ type: 'varchar', nullable: true })
  image!: string | null;

  @Column({
    type: 'enum',
    enum: DiscountType,
    default: DiscountType.PERCENTAGE,
  })
  discountType!: DiscountType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  discountValue!: number;

  @Column({ type: 'timestamp', nullable: true })
  startDate!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  endDate!: Date | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'boolean', default: false })
  timeBased!: boolean;

  @ManyToMany(() => Category, (category: Category) => category.categoryOffers)
  categories!: Category[];

  @ManyToMany(() => Brand, (brand: Brand) => brand.brandOffers)
  brands!: Brand[];

  @ManyToMany(() => Product, (product: Product) => product.productOffers)
  products!: Product[];

  @ManyToMany(
    () => ProductVariant,
    (productVariant: ProductVariant) => productVariant.productVariantOffers,
  )
  productVariants!: ProductVariant[];

  @ManyToOne(() => CmsSection, (section) => section.offers, {
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

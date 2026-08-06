import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Product } from './product.entity';
import { VariantAttribute } from './product-variant-attribute.entity';
import { VariantImage } from './variant-image.entity';
import { Offer } from './offer.entity';

@Entity('product_variants')
export class ProductVariant {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  stock!: number;

  @Column({ type: 'varchar', nullable: true })
  sku!: string | null;

  @Column({ type: 'varchar', nullable: true })
  slug!: string | null;

  @Column({ type: 'varchar', nullable: true })
  description!: string | null;

  @OneToMany(() => VariantAttribute, (va) => va.variant, { cascade: true })
  variantAttributes!: VariantAttribute[];

  @OneToMany(() => VariantImage, (image) => image.variant, { cascade: true })
  images!: VariantImage[];

  @ManyToMany(() => Offer, (offer) => offer.productVariants)
  @JoinTable()
  productVariantOffers!: Offer[];

  @ManyToOne(() => Product, (product) => product.variants, {
    onDelete: 'CASCADE',
  })
  product!: Product;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { Category } from '../productCategory/category.entity';
import { Product } from './product.entity';
import { Offer } from './offer.entity';

@Entity('brands')
export class Brand {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', unique: true, nullable: true })
  brandName!: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  brandSlug!: string;

  @Column({ type: 'varchar', nullable: true })
  shortDescription!: string;

  @Column({ type: 'varchar', nullable: true })
  description!: string;

  @Column({ type: 'varchar', nullable: true })
  website!: string;

  @Column({ type: 'varchar', nullable: true })
  metaTitle!: string;

  @Column({ type: 'varchar', nullable: true })
  metaDescription!: string;

  @Column({ type: 'varchar', nullable: true })
  metaKeywords!: string;

  @Column({ type: 'varchar', nullable: true })
  logo!: string;

  @Column({ default: true })
  isActive!: boolean;

  @ManyToMany(() => Category, { eager: true })
  @JoinTable()
  categories!: Category[];

  @ManyToMany(() => Offer, (offer) => offer.brands)
  @JoinTable()
  brandOffers!: Offer[];

  @OneToMany(() => Product, (product) => product.brand)
  products!: Product[];

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}

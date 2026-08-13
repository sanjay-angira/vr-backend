import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('product_images')
export class ProductImage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 2048 })
  originalUrl!: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  altText!: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  webp400!: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  webp800!: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  webp1200!: string | null;

  @Column({ default: 0 })
  sortOrder!: number;

  @ManyToOne(() => Product, (product) => product.images, {
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

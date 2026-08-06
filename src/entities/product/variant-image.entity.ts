import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductVariant } from './product-variants.entity';

@Entity('variant_images')
export class VariantImage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  url!: string;

  @Column({ default: 0 })
  sortOrder!: number;

  @ManyToOne(() => ProductVariant, (variant) => variant.images, {
    onDelete: 'CASCADE',
  })
  variant!: ProductVariant;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}

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

  @Column({ type: 'varchar', length: 2048 })
  originalUrl!: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  altText!: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  webp400!: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  jpg400!: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  webp800!: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  jpg800!: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  webp1200!: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  jpg1200!: string | null;

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

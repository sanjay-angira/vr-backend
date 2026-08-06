import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('tags')
export class Tags {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', nullable: true })
  tagName!: string;

  @Column({ type: 'varchar', nullable: true })
  tagSlug!: string;

  @Column({ type: 'boolean', nullable: true })
  isActive!: boolean;

  @ManyToOne(() => Product, (product) => product.productTags, {
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

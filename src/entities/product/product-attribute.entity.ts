import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { Attribute } from './attribute.entity';

@Entity('product_attributes')
export class ProductAttribute {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Product, (product) => product.productAttributes, {
    onDelete: 'CASCADE',
  })
  product!: Product;

  @ManyToOne(() => Attribute, (attribute) => attribute.categoryAttributes, {
    onDelete: 'CASCADE',
  })
  attribute!: Attribute;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}

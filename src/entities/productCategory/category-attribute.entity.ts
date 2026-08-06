import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';
import { Category } from './category.entity';
import { Attribute } from '../product/attribute.entity';

@Entity('category_attributes')
export class CategoryAttribute {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Category, (category) => category.categoryAttributes, {
    onDelete: 'CASCADE',
  })
  category!: Category;

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

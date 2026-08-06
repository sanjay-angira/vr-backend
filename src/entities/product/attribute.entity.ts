import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CategoryAttribute } from '../productCategory/category-attribute.entity';
import { ProductAttribute } from './product-attribute.entity';

@Entity('attributes')
export class Attribute {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ default: false })
  isFilterable!: boolean;

  @Column({ default: false })
  isRequired!: boolean;

  @Column({ default: false })
  supportsImage!: boolean;

  @OneToMany(() => CategoryAttribute, (ca) => ca.attribute)
  categoryAttributes!: CategoryAttribute[];

  @OneToMany(() => ProductAttribute, (pa) => pa.attribute)
  productAttributes!: ProductAttribute[];

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductVariant } from './product-variants.entity';
import { Attribute } from './attribute.entity';

export enum AtttributeViewOption {
  VALUE = 'value',
  CODE = 'code',
  IMAGE = 'image',
}

@Entity('variant_attributes')
export class VariantAttribute {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => ProductVariant, (variant) => variant.variantAttributes, {
    onDelete: 'CASCADE',
  })
  variant!: ProductVariant;

  @ManyToOne(() => Attribute)
  attribute!: Attribute;

  @Column({ type: 'int', nullable: true })
  optionId!: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  value!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  code!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  image!: string | null;

  @Column({
    type: 'enum',
    enum: AtttributeViewOption,
    default: AtttributeViewOption.VALUE,
  })
  viewOption!: AtttributeViewOption;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}

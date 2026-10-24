import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Brand } from './brand.entity';

export enum WarehouseRegistrationStatus {
  PENDING = 'PENDING',
  REGISTERED = 'REGISTERED',
  FAILED = 'FAILED',
  RECONCILIATION_REQUIRED = 'RECONCILIATION_REQUIRED',
}

@Entity('warehouses')
@Index('IDX_warehouses_brand_id', ['brandId'])
@Index('UQ_warehouses_brand_name_pin', ['brandId', 'name', 'pincode'], {
  unique: true,
})
@Index('UQ_warehouses_brand_default', ['brandId'], {
  unique: true,
  where: '"isDefault" = true',
})
export class Warehouse {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  brandId!: number;

  @ManyToOne(() => Brand, (brand) => brand.warehouses, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'brandId' })
  brand!: Brand;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 120 })
  contactName!: string;

  @Column({ type: 'varchar', length: 254 })
  email!: string;

  @Column({ type: 'varchar', length: 20 })
  phone!: string;

  @Column({ type: 'varchar', length: 255 })
  addressLine1!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  addressLine2!: string | null;

  @Column({ type: 'varchar', length: 100 })
  city!: string;

  @Column({ type: 'varchar', length: 100 })
  state!: string;

  @Column({ type: 'varchar', length: 100, default: 'India' })
  country!: string;

  @Column({ type: 'varchar', length: 6 })
  pincode!: string;

  @Column({ type: 'varchar', length: 150 })
  registeredName!: string;

  @Column({ type: 'varchar', length: 500 })
  returnAddress!: string;

  @Column({ type: 'varchar', length: 6 })
  returnPin!: string;

  @Column({ type: 'varchar', length: 100 })
  returnCity!: string;

  @Column({ type: 'varchar', length: 100 })
  returnState!: string;

  @Column({ type: 'varchar', length: 100, default: 'India' })
  returnCountry!: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  delhiveryWarehouseName!: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  delhiveryWarehouseId!: string | null;

  @Column({
    type: 'varchar',
    length: 32,
    default: WarehouseRegistrationStatus.PENDING,
  })
  registrationStatus!: WarehouseRegistrationStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  registrationError!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  registeredAt!: Date | null;

  @Column({ type: 'boolean', default: false })
  isDefault!: boolean;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}

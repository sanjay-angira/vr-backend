import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from './user.entity';

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  couponCode!: string;

  @Column({ type: 'varchar', nullable: true })
  image!: string | null;

  @Column({ type: 'enum', enum: DiscountType })
  discountType!: DiscountType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  discountValue!: number;

  @Column({ type: 'date' })
  startDate!: Date;

  @Column({ type: 'date' })
  endDate!: Date;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: false })
  isUserSpecific!: boolean;

  @Column({ default: false })
  isDeleted!: boolean;

  @ManyToMany(() => User, { cascade: true })
  @JoinTable({
    name: 'coupon_users',
    joinColumn: { name: 'couponId' },
    inverseJoinColumn: { name: 'userId' },
  })
  users!: User[];

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}

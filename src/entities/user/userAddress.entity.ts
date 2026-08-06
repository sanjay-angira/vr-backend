import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

/**
 * Saved delivery addresses for a customer.
 * Each address can belong to a relative (own name / phone / email).
 */
@Entity('user_addresses')
export class UserAddress {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  userId!: number;

  @ManyToOne(() => User, (user) => user.addresses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  /** Label e.g. Home, Office, Relative */
  @Column({ type: 'varchar', length: 50, nullable: true })
  label!: string | null;

  /** Recipient full name (can differ from account holder). */
  @Column({ type: 'varchar', length: 120 })
  fullName!: string;

  @Column({ type: 'varchar', length: 20 })
  phone!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 255 })
  addressLine1!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  addressLine2!: string | null;

  @Column({ type: 'varchar', length: 100 })
  city!: string;

  @Column({ type: 'varchar', length: 100 })
  state!: string;

  @Column({ type: 'varchar', length: 12 })
  pincode!: string;

  @Column({ type: 'boolean', default: false })
  isDefault!: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserRole } from './userRole.entity';
import { Review } from '../product/review.entity';
import { UserAddress } from './userAddress.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 25, nullable: true })
  firstName!: string;

  @Column({ type: 'varchar', length: 25, nullable: true })
  lastName!: string;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  email!: string;

  @Column({ type: 'boolean', default: false })
  emailVerified!: boolean;

  @Column({ type: 'varchar', length: 6, nullable: true })
  emailOTP!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  emailOTPExpires!: Date | null;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  profileImage!: string;

  @Column({ type: 'varchar', length: 12, unique: true, nullable: true })
  phoneNumber!: string;

  @Column({ type: 'boolean', default: false })
  phoneNumberVerified!: boolean;

  @Column({ type: 'varchar', length: 6, nullable: true })
  phoneNumberOTP!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  phoneNumberOTPExpires!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  isBlockedUntil!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  lastOtpRequestedAt!: Date | null;

  @Column({ type: 'int', default: 0, nullable: true })
  otpRequestCount!: number;

  @Column({ type: 'timestamp', nullable: true })
  blockUntil!: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password!: string;

  @Column({ type: 'boolean', default: false, nullable: true })
  isDeleteRequested!: boolean;

  @Column({ type: 'boolean', default: true, nullable: true })
  isActive!: boolean;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles!: UserRole[];

  @OneToMany(() => Review, (review) => review.user, { cascade: true })
  reviews!: Review[];

  @OneToMany(() => UserAddress, (address) => address.user, { cascade: true })
  addresses!: UserAddress[];

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}

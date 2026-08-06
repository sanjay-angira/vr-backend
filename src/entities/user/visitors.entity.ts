import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('visitors')
export class Visitor {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 12, unique: true })
  phoneNumber!: string;

  @Column({ type: 'varchar', length: 6, nullable: true })
  phoneNumberOTP!: string;

  @Column({ type: 'timestamp', nullable: true })
  phoneNumberOTPExpires!: Date;

  @Column({ type: 'boolean', default: false })
  isVerified!: boolean;

  @Column({ type: 'int', default: 0 })
  otpRequestCount!: number;

  @Column({ type: 'timestamp', nullable: true })
  lastOtpRequestedAt!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  isBlockedUntil!: Date | null;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}

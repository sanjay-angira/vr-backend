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

@Entity('trial_users')
export class TrialUser {
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

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  profileImage!: string;

  @Column({ type: 'varchar', length: 12, unique: true, nullable: true })
  phoneNumber!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password!: string;

  @Column({ type: 'boolean', default: true, nullable: true })
  isActive!: boolean;

  @Column({ type: 'varchar', length: 6, nullable: true })
  resetPasswordOTP!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  resetPasswordOTPExpires!: Date | null;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles!: UserRole[];

  @OneToMany(() => Review, (review) => review.user, { cascade: true })
  reviews!: Review[];

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}

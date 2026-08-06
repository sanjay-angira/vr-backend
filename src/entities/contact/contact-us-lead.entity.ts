import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ContactLeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  RESOLVED = 'resolved',
}

@Entity('contact_us_leads')
export class ContactUsLead {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 120 })
  firstName!: string;

  @Column({ type: 'varchar', length: 120 })
  lastName!: string;

  @Column({ type: 'varchar', length: 180 })
  email!: string;

  @Column({ type: 'varchar', length: 30 })
  phoneNumber!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'boolean', default: false })
  emailVerified!: boolean;

  @Column({ type: 'varchar', length: 10, nullable: true })
  emailOtp!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  emailOtpExpires!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt!: Date | null;

  @Column({
    type: 'enum',
    enum: ContactLeadStatus,
    default: ContactLeadStatus.NEW,
  })
  status!: ContactLeadStatus;
  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}

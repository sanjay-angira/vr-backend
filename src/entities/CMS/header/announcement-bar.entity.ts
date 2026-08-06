import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('announcement_bars')
export class AnnouncementBar {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  linkText!: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  linkUrl!: string | null;

  @Column({ default: '#000000' })
  backgroundColor!: string;

  @Column({ default: '#ffffff' })
  textColor!: string;

  @Column({ type: 'timestamp', nullable: true })
  startDate!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  endDate!: Date | null;

  @Column({ default: 0 })
  priority!: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}

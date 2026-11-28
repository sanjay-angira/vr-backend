import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('newsletter_subscribers')
@Index('UQ_newsletter_subscribers_email', ['email'], { unique: true })
export class NewsletterSubscriber {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 320 })
  email!: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  consentedAt!: Date;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;
}

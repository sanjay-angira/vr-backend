import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('site_settings')
export class SiteSetting {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  logoUrl!: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  mobileLogoUrl!: string | null;

  @Column({ default: true })
  stickyHeader!: boolean;

  @Column({ default: true })
  showSearch!: boolean;

  @Column({ default: true })
  showCart!: boolean;

  @Column({ default: true })
  showWishlist!: boolean;

  @Column({ default: true })
  showAccount!: boolean;

  @Column({ default: '#ffffff' })
  backgroundColor!: string;

  @Column({ default: '#111111' })
  textColor!: string;

  @Column({ type: 'int', nullable: true })
  activeMenuId!: number | null;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}

import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Banner } from './banner.entity';

export enum BannerImageRole {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
}

@Entity('banner_images')
export class BannerImage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 2048 })
  originalUrl!: string;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  webp800!: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  jpg800!: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  webp1200!: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  jpg1200!: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  webp1440!: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  jpg1440!: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  webp1920!: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  jpg1920!: string | null;

  @Column({
    type: 'enum',
    enum: BannerImageRole,
    default: BannerImageRole.DESKTOP,
  })
  role!: BannerImageRole;

  @Column({ default: 0 })
  sortOrder!: number;

  @ManyToOne(() => Banner, (banner) => banner.images, {
    onDelete: 'CASCADE',
  })
  banner!: Banner;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CmsSection } from './cmsSettings.entity';
import { BannerImage } from './banner-image.entity';

@Entity('banners')
export class Banner {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ nullable: true })
  subtitle!: string;

  @Column({ nullable: true })
  bannerLink!: string;

  @Column({ default: 0 })
  position!: number;

  @Column({ default: true })
  status!: boolean;

  @OneToMany(() => BannerImage, (image) => image.banner, { cascade: true })
  images!: BannerImage[];

  @ManyToOne(() => CmsSection, (section) => section.banners, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  section!: CmsSection | null;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}

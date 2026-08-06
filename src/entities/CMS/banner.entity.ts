import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CmsSection } from './cmsSettings.entity';

@Entity('banners')
export class Banner {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ nullable: true })
  subtitle!: string;

  @Column()
  image!: string;

  @Column({ nullable: true })
  mobileImage!: string;

  @Column({ nullable: true })
  bannerLink!: string;

  @Column({ default: 0 })
  position!: number;

  @Column({ default: true })
  status!: boolean;

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

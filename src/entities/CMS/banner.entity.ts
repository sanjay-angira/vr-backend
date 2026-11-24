import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('banners')
export class Banner {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  desktopImage!: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  tabletImage!: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  mobileImage!: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  bannerLink!: string | null;

  @Column({ default: 0 })
  position!: number;

  @Column({ default: true })
  status!: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}

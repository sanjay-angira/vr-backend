import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('modules')
export class Modules {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', nullable: true })
  name!: string;

  @Column({ type: 'varchar', nullable: true })
  router_link!: string;

  @Column({ type: 'varchar', nullable: true })
  icon!: string;

  @Column({ type: 'integer', nullable: true })
  order!: number;

  @Column({ type: 'varchar', default: null })
  categories!: string;

  @Column({ type: 'integer', nullable: true })
  categoryOrderNo!: number;

  @Column({ type: 'varchar', default: null })
  category_icon!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}

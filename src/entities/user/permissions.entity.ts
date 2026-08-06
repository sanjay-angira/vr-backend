import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('permissions')
export class Permissions {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  userId!: number;

  @Column({ type: 'int' })
  moduleId!: number;

  @Column({ type: 'boolean', default: false })
  canRead!: boolean;

  @Column({ type: 'boolean', default: false })
  canView!: boolean;

  @Column({ type: 'boolean', default: false })
  canEdit!: boolean;

  @Column({ type: 'boolean', default: false })
  canAdd!: boolean;

  @Column({ type: 'boolean', default: false })
  canDelete!: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { UserRole } from './userRole.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  roleId!: number;

  @Column({ type: 'varchar', length: 255 })
  roleName!: string;

  @OneToMany(() => UserRole, (userRole) => userRole.role)
  userRoles!: UserRole[];

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}

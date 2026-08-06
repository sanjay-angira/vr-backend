import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Menu } from './menu.entity';

@Entity('menu_items')
export class MenuItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  menuId!: number;

  @ManyToOne(() => Menu, (menu) => menu.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menuId' })
  menu!: Menu;

  @Column({ type: 'int', nullable: true })
  parentId!: number | null;

  @ManyToOne(() => MenuItem, (item) => item.children, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parentId' })
  parent!: MenuItem | null;

  @OneToMany(() => MenuItem, (item) => item.parent)
  children!: MenuItem[];

  @Column()
  label!: string;

  @Column()
  url!: string;

  @Column({ default: 0 })
  sortOrder!: number;

  @Column({ default: true })
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

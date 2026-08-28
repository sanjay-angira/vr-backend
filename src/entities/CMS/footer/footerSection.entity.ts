import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { FooterItem } from './footerItem.entity';

@Entity('footer_sections')
export class FooterSection {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ default: 'menu' })
  type!: string;

  @Column({ default: 0 })
  position!: number;

  @Column({ default: true })
  status!: boolean;

  @OneToMany(() => FooterItem, (item) => item.section)
  items!: FooterItem[];
}

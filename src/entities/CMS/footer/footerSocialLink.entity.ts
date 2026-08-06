import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { FooterSection } from './footerSection.entity';

@Entity('footer_social_links')
export class FooterSocialLink {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  sectionId!: number;

  @ManyToOne(() => FooterSection, (section) => section.socialLinks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sectionId' })
  section!: FooterSection;

  @Column()
  label!: string;

  @Column({ nullable: true })
  url!: string;

  @Column({ nullable: true })
  icon!: string;

  @Column({ default: 0 })
  position!: number;

  @Column({ default: true })
  status!: boolean;
}

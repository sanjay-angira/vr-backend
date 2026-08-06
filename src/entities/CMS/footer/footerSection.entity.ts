import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { FooterItem } from './footerItem.entity';
import { FooterSocialLink } from './footerSocialLink.entity';
import { FooterPaymentMethod } from './footerPaymentMethod.entity';

@Entity('footer_sections')
export class FooterSection {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column()
  type!: string; // menu, social, contact, payment

  @Column({ default: 0 })
  position!: number;

  @Column({ default: true })
  status!: boolean;

  @OneToMany(() => FooterItem, (item) => item.section)
  items!: FooterItem[];

  @OneToMany(() => FooterSocialLink, (link) => link.section)
  socialLinks!: FooterSocialLink[];

  @OneToMany(() => FooterPaymentMethod, (method) => method.section)
  paymentMethods!: FooterPaymentMethod[];
}

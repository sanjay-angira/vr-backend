import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('footer_settings')
export class FooterSetting {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  email!: string;

  @Column({ nullable: true })
  phone!: string;

  @Column({ nullable: true })
  address!: string;

  @Column({ nullable: true })
  copyrightText!: string;

  @Column({ default: true })
  status!: boolean;
}

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from './category.entity';

@Entity('category_seo')
export class CategorySeo {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => Category, (category) => category.seo)
  @JoinColumn()
  category!: Category;

  @Column({ type: 'varchar', length: 70, nullable: true })
  metaTitle!: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  metaDescription!: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  metaKeywords!: string;

  @Column({ type: 'varchar', nullable: true })
  canonicalUrl!: string;

  @Column({ type: 'varchar', nullable: true })
  focusKeyword!: string;

  @Column({ type: 'varchar', nullable: true })
  metaRobots!: string; // e.g. 'index, follow'

  @Column({ type: 'varchar', nullable: true })
  ogTitle!: string;

  @Column({ type: 'text', nullable: true })
  ogDescription!: string;

  @Column({ type: 'varchar', nullable: true })
  ogImage!: string;

  @Column({ type: 'varchar', nullable: true })
  twitterCard!: string;

  @Column({ type: 'varchar', nullable: true })
  twitterTitle!: string;

  @Column({ type: 'varchar', nullable: true })
  twitterDescription!: string;

  @Column({ type: 'varchar', nullable: true })
  twitterImage!: string;

  @Column({ type: 'varchar', nullable: true })
  schemaType!: string; // e.g. 'CollectionPage', 'BreadcrumbList'

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}

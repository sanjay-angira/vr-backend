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
  @JoinColumn({ name: 'categoryId' })
  category!: Category;

  @Column({ type: 'integer', unique: true })
  categoryId!: number;

  @Column({ type: 'varchar', length: 70, nullable: true })
  metaTitle!: string | null;

  @Column({ type: 'varchar', length: 320, nullable: true })
  metaDescription!: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  canonicalUrl!: string | null;

  @Column({ type: 'text', nullable: true })
  metaKeywords!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  focusKeyword!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  secondaryKeywords!: string[] | null;

  @Column({ type: 'varchar', length: 95, nullable: true })
  ogTitle!: string | null;

  @Column({ type: 'varchar', length: 320, nullable: true })
  ogDescription!: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  ogImage!: string | null;

  @Column({ type: 'boolean', default: true })
  robotsIndex!: boolean;

  @Column({ type: 'boolean', default: true })
  robotsFollow!: boolean;

  @Column({ type: 'varchar', length: 50, default: 'CollectionPage' })
  schemaType!: string;

  // Retained for compatibility with existing category SEO clients.
  @Column({ type: 'varchar', nullable: true })
  metaRobots!: string; // e.g. 'index, follow'

  @Column({ type: 'varchar', nullable: true })
  twitterCard!: string;

  @Column({ type: 'varchar', nullable: true })
  twitterTitle!: string;

  @Column({ type: 'varchar', nullable: true })
  twitterDescription!: string;

  @Column({ type: 'varchar', nullable: true })
  twitterImage!: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}

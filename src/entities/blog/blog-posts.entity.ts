import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  OneToOne,
} from 'typeorm';
import { BlogTag } from './blog-tag.entity';
import { BlogCategory } from './blog-category.entity';
import { BlogSeo } from './blog-seo.entity';
import { CmsSection } from '../CMS/cmsSettings.entity';

@Entity('blog_posts')
export class BlogPost {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 255 })
  title!: string;

  @Column({ unique: true })
  slug!: string;

  @Column({ type: 'varchar', nullable: true })
  excerpt!: string | null;

  @Column({ type: 'varchar' })
  content!: string;

  /** Blog cover image URL (uploaded as WebP). */
  @Column({ type: 'varchar', length: 2048, nullable: true })
  blogImage!: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  blogImageAlt!: string | null;

  @Column({ type: 'json', nullable: true })
  faqs!: { question: string; answer: string }[] | null;

  @Column({ default: 0 })
  views!: number;

  @Column({ default: 0 })
  readingTime!: number; // in minutes

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: false })
  isFeatured!: boolean;

  @Column({
    type: 'enum',
    enum: ['draft', 'published', 'scheduled'],
    default: 'draft',
  })
  status!: string;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt!: Date | null;

  @ManyToOne(() => BlogCategory, (category) => category.blogPosts)
  category!: BlogCategory;

  @ManyToMany(() => BlogTag, (tag) => tag.blogPosts)
  @JoinTable()
  tags!: BlogTag[];

  @OneToOne(() => BlogSeo, (seo) => seo.blog, { cascade: true })
  seo!: BlogSeo;

  @ManyToOne(() => CmsSection, (section) => section.blogs, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  section!: CmsSection | null;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}

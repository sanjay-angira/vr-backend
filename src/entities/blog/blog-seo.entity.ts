import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BlogPost } from './blog-posts.entity';

@Entity('blog_seo')
export class BlogSeo {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => BlogPost, (blog) => blog.seo)
  @JoinColumn()
  blog!: BlogPost;

  @Column({ length: 70 })
  metaTitle!: string;

  @Column({ length: 160 })
  metaDescription!: string;

  @Column({ nullable: true })
  canonicalUrl!: string;

  @Column({ nullable: true })
  focusKeyword!: string;

  @Column({ nullable: true })
  metaRobots!: string; // index, follow

  @Column({ nullable: true })
  ogTitle!: string;

  @Column({ type: 'text', nullable: true })
  ogDescription!: string;

  @Column({ nullable: true })
  ogImage!: string;

  @Column({ nullable: true })
  twitterCard!: string;

  @Column({ nullable: true })
  twitterTitle!: string;

  @Column({ nullable: true })
  twitterDescription!: string;

  @Column({ nullable: true })
  twitterImage!: string;

  @Column({ nullable: true })
  schemaType!: string; // Article, BlogPosting

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}

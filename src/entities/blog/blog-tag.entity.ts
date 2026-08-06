import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
} from 'typeorm';
import { BlogPost } from './blog-posts.entity';

@Entity('blog_tags')
export class BlogTag {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'varchar', length: 255 })
  slug!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @ManyToMany(() => BlogPost, (blog) => blog.tags)
  blogPosts!: BlogPost[];

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}

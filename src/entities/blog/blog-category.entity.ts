import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { BlogPost } from './blog-posts.entity';

@Entity('blog_categories')
export class BlogCategory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'varchar', length: 255 })
  slug!: string;

  @Column({ type: 'varchar', nullable: true })
  description!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(() => BlogPost, (blog) => blog.category)
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

import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BlogPost } from './blog-posts.entity';



@Entity('blog_images')
export class BlogImage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 2048 })
  originalUrl!: string;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  webp400!: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  jpg400!: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  webp800!: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  jpg800!: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  webp1200!: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  jpg1200!: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  altText!: string | null;

  @Column({ default: 0 })
  sortOrder!: number;

  @ManyToOne(() => BlogPost, (blog) => blog.images, {
    onDelete: 'CASCADE',
  })
  blog!: BlogPost;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;

}



import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from './category.entity';
@Entity('category_images')

export class CategoryImage {
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

  @Column({ type: 'varchar', length: 512, nullable: true })
  altText!: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  image3d!: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  video!: string | null;

  @Column({ default: 0 })
  sortOrder!: number;

  @ManyToOne(() => Category, (category) => category.images, {
    onDelete: 'CASCADE',
  })
  category!: Category;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;

}



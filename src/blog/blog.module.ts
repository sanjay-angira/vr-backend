import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { BlogCategoryService } from './blog-category.service';
import { BlogCategoryController } from './blog-category.controller';
import { BlogTagService } from './blog-tag.service';
import { BlogTagController } from './blog-tag.controller';
import { BlogPost } from 'src/entities/blog/blog-posts.entity';
import { BlogTag } from 'src/entities/blog/blog-tag.entity';
import { BlogCategory } from 'src/entities/blog/blog-category.entity';
import { User } from 'src/entities/user/user.entity';
import { CommonModule } from '../commonServices/common.module';
import { UtilityService } from '../commonServices/utility.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([BlogPost, BlogTag, BlogCategory, User]),
    CommonModule,
  ],
  controllers: [BlogController, BlogCategoryController, BlogTagController],
  providers: [BlogService, BlogCategoryService, BlogTagService, UtilityService],
  exports: [BlogService],
})
export class BlogModule {}

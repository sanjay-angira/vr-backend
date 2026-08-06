import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { Review } from '../entities/product/review.entity';
import { Product } from '../entities/product/product.entity';
import { User } from '../entities/user/user.entity';
import { CreateReviewDto } from '../dto/review.dto';
import { UpdateReviewDto } from '../dto/review.dto';
import { PaginationDto } from '../dto/common.dto';
import {
  successResponse,
  errorResponse,
} from 'src/commonServices/response.service';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createReviewDto: CreateReviewDto): Promise<any> {
    const {
      productId,
      userId,
      comment,
      rating,
      isApproved,
      isManual,
      userName,
    } = createReviewDto;
    try {
      const product = await this.productRepository.findOne({
        where: { id: productId },
      });
      if (!product) {
        return errorResponse(`Product with ID ${productId} not found`, 404);
      }

      // Check if user exists
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      const reviewInstance = this.reviewRepository.create({
        comment,
        rating,
        isApproved,
        isManual,
        userName: isManual ? userName : null,
        product,
        user: isManual ? null : user,
      });
      const review = await this.reviewRepository.save(reviewInstance);

      return successResponse(review, 'Review created successfully', 201);
    } catch (error) {
      throw error;
    }
  }

  async findAll(paginationDto: PaginationDto): Promise<any> {
    const { pageNumber = '1', pageSize = '10', search = '' } = paginationDto;
    try {
      const skip = (parseInt(pageNumber) - 1) * parseInt(pageSize);
      const take = parseInt(pageSize);

      // Build where condition for search
      let whereCondition: any = {};

      // Only add search condition if search term is provided and not empty/null/undefined
      if (
        search &&
        search.trim() !== '' &&
        search !== 'null' &&
        search !== 'undefined'
      ) {
        whereCondition = [
          { comment: ILike(`%${search}%`) },
          { user: { firstName: ILike(`%${search}%`) } },
          { user: { lastName: ILike(`%${search}%`) } },
          { userName: ILike(`%${search}%`) },
        ];
      }

      const [rows, count] = await this.reviewRepository.findAndCount({
        where: whereCondition,
        order: { createdAt: 'DESC' },
        skip,
        take,
        relations: ['product', 'user'],
      });

      return successResponse(
        { rows, count },
        'Reviews retrieved successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: number): Promise<any> {
    try {
      const review = await this.reviewRepository.findOne({
        where: { id },
        relations: ['product', 'user'],
      });

      if (!review) {
        return errorResponse(`Review with ID ${id} not found`, 404);
      }

      return successResponse(review, 'Review retrieved successfully');
    } catch (error) {
      throw error;
    }
  }

  async update(id: number, updateReviewDto: UpdateReviewDto): Promise<any> {
    const {
      isManual,
      productId,
      userId,
      userName,
      comment,
      rating,
      isApproved,
    } = updateReviewDto;
    try {
      // First check if the review exists
      const existingReview = await this.reviewRepository.findOne({
        where: { id },
        relations: ['product', 'user'],
      });

      if (!existingReview) {
        return errorResponse(`Review with ID ${id} not found`, 404);
      }

      const product = await this.productRepository.findOne({
        where: { id: productId },
      });
      if (!product) {
        return errorResponse(`Product with ID ${productId} not found`, 404);
      }

      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      existingReview.product = product;
      existingReview.isManual = isManual;
      existingReview.comment = comment;
      existingReview.userName = isManual ? userName : null;
      existingReview.rating = rating;
      existingReview.isApproved = isApproved;
      existingReview.user = isManual ? null : user;
      const updatedReview = await this.reviewRepository.save(existingReview);

      return successResponse(updatedReview, 'Review updated successfully');
    } catch (error) {
      throw error;
    }
  }

  async remove(id: number): Promise<any> {
    try {
      const review = await this.reviewRepository.findOne({
        where: { id },
      });

      if (!review) {
        return errorResponse(`Review with ID ${id} not found`, 404);
      }

      await this.reviewRepository.remove(review);
      return successResponse(
        null,
        'Review deleted successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      throw error;
    }
  }

  async findByProduct(
    productId: number,
    paginationDto: PaginationDto,
  ): Promise<any> {
    try {
      // Check if product exists
      const product = await this.productRepository.findOne({
        where: { id: productId },
      });
      if (!product) {
        return errorResponse(`Product with ID ${productId} not found`, 404);
      }

      const { pageNumber = '1', pageSize = '10' } = paginationDto;
      const skip = (parseInt(pageNumber) - 1) * parseInt(pageSize);
      const take = parseInt(pageSize);

      const [data, total] = await this.reviewRepository.findAndCount({
        where: { product: { id: productId } },
        order: { createdAt: 'DESC' },
        skip,
        take,
        relations: ['user'],
      });

      return successResponse(
        { data, total },
        'Product reviews retrieved successfully',
      );
    } catch (error) {
      throw error;
    }
  }

  async findByUser(userId: number, paginationDto: PaginationDto): Promise<any> {
    try {
      // Check if user exists
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });
      if (!user) {
        return errorResponse(`User with ID ${userId} not found`, 404);
      }

      const { pageNumber = '1', pageSize = '10' } = paginationDto;
      const skip = (parseInt(pageNumber) - 1) * parseInt(pageSize);
      const take = parseInt(pageSize);

      const [data, total] = await this.reviewRepository.findAndCount({
        where: { user: { id: userId } },
        order: { createdAt: 'DESC' },
        skip,
        take,
        relations: ['product'],
      });

      return successResponse(
        { data, total },
        'User reviews retrieved successfully',
      );
    } catch (error) {
      throw error;
    }
  }

  async getAverageRatingByProduct(productId: number): Promise<any> {
    try {
      // Check if product exists
      const product = await this.productRepository.findOne({
        where: { id: productId },
      });
      if (!product) {
        return errorResponse(`Product with ID ${productId} not found`, 404);
      }

      const result = await this.reviewRepository
        .createQueryBuilder('review')
        .select('AVG(review.rating)', 'average')
        .where('review.productId = :productId', { productId })
        .getRawOne();

      const average = result ? parseFloat(result.average) || 0 : 0;
      return successResponse(average, 'Average rating retrieved successfully');
    } catch (error) {
      throw error;
    }
  }
}

import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationDto } from 'src/dto/common.dto';
import { SubscribeNewsletterDto } from 'src/dto/newsletter.dto';
import { successResponse } from 'src/commonServices/response.service';
import { NewsletterSubscriber } from 'src/entities/newsletter/newsletter-subscriber.entity';
import { Repository } from 'typeorm';

@Injectable()
export class NewsletterService {
  constructor(
    @InjectRepository(NewsletterSubscriber)
    private readonly subscriberRepository: Repository<NewsletterSubscriber>,
  ) {}

  async subscribe(dto: SubscribeNewsletterDto) {
    const email = dto.email.trim().toLowerCase();

    await this.subscriberRepository
      .createQueryBuilder()
      .insert()
      .into(NewsletterSubscriber)
      .values({ email, consentedAt: new Date() })
      .orIgnore()
      .execute();

    return successResponse(
      { subscribed: true },
      'Thanks for signing up for our newsletter.',
      HttpStatus.OK,
    );
  }

  async findSubscribers(pagination: PaginationDto) {
    const parsedPage = Number(pagination.pageNumber);
    const parsedSize = Number(pagination.pageSize);
    const pageNumber =
      Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const pageSize =
      Number.isSafeInteger(parsedSize) && parsedSize > 0
        ? Math.min(parsedSize, 100)
        : 50;

    const [rows, count] = await this.subscriberRepository.findAndCount({
      select: ['id', 'email', 'consentedAt', 'createdAt'],
      order: { createdAt: 'DESC' },
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
    });

    return successResponse(
      { rows, count, pageNumber, pageSize },
      'Newsletter subscribers retrieved successfully',
      HttpStatus.OK,
    );
  }
}

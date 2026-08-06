import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FooterPaymentMethod } from 'src/entities/CMS/footer/footerPaymentMethod.entity';
import {
  errorResponse,
  successResponse,
} from 'src/commonServices/response.service';

@Injectable()
export class FooterPaymentMethodsService {
  constructor(
    @InjectRepository(FooterPaymentMethod)
    private footerPaymentMethodRepo: Repository<FooterPaymentMethod>,
  ) {}

  async findAll() {
    const methods = await this.footerPaymentMethodRepo.find({
      relations: {
        section: true,
      },
      order: {
        position: 'ASC',
      },
    });
    return successResponse(
      methods,
      'Footer payment methods retrieved successfully',
    );
  }

  async findBySection(sectionId: number) {
    const methods = await this.footerPaymentMethodRepo.find({
      where: {
        sectionId,
      },
      order: {
        position: 'ASC',
      },
    });
    return successResponse(
      methods,
      'Footer payment methods retrieved successfully',
    );
  }

  create(payload: Partial<FooterPaymentMethod>) {
    const method = this.footerPaymentMethodRepo.create(payload);
    return this.footerPaymentMethodRepo.save(method);
  }

  async update(id: number, payload: Partial<FooterPaymentMethod>) {
    const method = await this.footerPaymentMethodRepo.findOne({
      where: { id },
    });

    if (!method) {
      throw new NotFoundException();
    }

    Object.assign(method, payload);
    return this.footerPaymentMethodRepo.save(method);
  }

  async remove(id: number) {
    const method = await this.footerPaymentMethodRepo.findOne({
      where: { id },
    });

    if (!method) {
      throw new NotFoundException();
    }

    return this.footerPaymentMethodRepo.remove(method);
  }
}

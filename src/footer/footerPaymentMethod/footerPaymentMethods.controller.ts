import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { FooterPaymentMethodsService } from './footerPaymentMethods.service';
import {
  CreateFooterPaymentMethodDto,
  UpdateFooterPaymentMethodDto,
} from 'src/dto/footer.dto';

@Controller('footer-payment-methods')
export class FooterPaymentMethodsController {
  constructor(
    private readonly footerPaymentMethodsService: FooterPaymentMethodsService,
  ) {}

  @Get()
  findAll() {
    return this.footerPaymentMethodsService.findAll();
  }

  @Get('section/:sectionId')
  findBySection(@Param('sectionId') sectionId: number) {
    return this.footerPaymentMethodsService.findBySection(sectionId);
  }

  @Post()
  create(@Body() dto: CreateFooterPaymentMethodDto) {
    return this.footerPaymentMethodsService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() dto: UpdateFooterPaymentMethodDto) {
    return this.footerPaymentMethodsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.footerPaymentMethodsService.remove(id);
  }
}

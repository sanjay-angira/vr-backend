import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { FooterSectionsService } from './footerSetions.service';
import {
  CreateFooterSectionDto,
  UpdateFooterSectionDto,
} from 'src/dto/footer.dto';

@Controller('admin/footer-sections')
export class FooterSectionsController {
  constructor(private readonly footerSectionsService: FooterSectionsService) {}

  @Get()
  findAll() {
    return this.footerSectionsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateFooterSectionDto) {
    return this.footerSectionsService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() dto: UpdateFooterSectionDto) {
    return this.footerSectionsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.footerSectionsService.remove(id);
  }
}

import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
  Query,
  Put,
} from '@nestjs/common';
import { AttributeService } from './attribute.service';
import {
  AttributeQueryDto,
  CreateAttributeDto,
  UpdateAttributeDto,
} from '../dto/attribute.dto';
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('Attributes')
@Controller('attributes')
export class AttributeController {
  constructor(private readonly attributeService: AttributeService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new attribute' })
  @ApiBody({
    type: CreateAttributeDto,
    examples: {
      example1: {
        value: {
          name: 'Weight',
          isFilterable: true,
          isRequired: false,
        },
      },
    },
  })
  create(@Body() dto: CreateAttributeDto) {
    return this.attributeService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all attributes' })
  @ApiQuery({ name: 'pageNumber', required: false, type: String })
  @ApiQuery({ name: 'pageSize', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'column', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, type: String })
  findAll(@Query() pagination: AttributeQueryDto) {
    return this.attributeService.findAll(pagination);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.attributeService.findOne(id);
  }

  @Put(':id')
  @ApiBody({
    type: UpdateAttributeDto,
    examples: {
      example1: {
        value: {
          name: 'Material',
          isFilterable: true,
          isRequired: true,
        },
      },
    },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAttributeDto,
  ) {
    return this.attributeService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.attributeService.remove(id);
  }
}

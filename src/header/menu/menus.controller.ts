import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { MenusService } from './menus.service';
import { CreateMenuDto, UpdateMenuDto } from 'src/dto/header.dto';

@ApiTags('Admin Menus')
@Controller('admin/menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Get()
  @ApiOperation({ summary: 'List menus with items' })
  findAll() {
    return this.menusService.findAllForAdmin();
  }

  @Post()
  @ApiOperation({ summary: 'Create menu' })
  create(@Body() dto: CreateMenuDto) {
    return this.menusService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update menu' })
  @ApiParam({ name: 'id', type: Number })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMenuDto) {
    return this.menusService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete menu' })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.menusService.remove(id);
  }
}

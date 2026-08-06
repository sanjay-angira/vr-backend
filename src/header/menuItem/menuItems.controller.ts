import {
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { MenuItemsService } from './menuItems.service';
import { CreateMenuItemDto, UpdateMenuItemDto } from 'src/dto/header.dto';

@ApiTags('Admin Menu Items')
@Controller('admin/menu-items')
export class MenuItemsController {
  constructor(private readonly menuItemsService: MenuItemsService) {}

  @Post()
  @ApiOperation({ summary: 'Create menu item' })
  create(@Body() dto: CreateMenuItemDto) {
    return this.menuItemsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update menu item' })
  @ApiParam({ name: 'id', type: Number })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMenuItemDto,
  ) {
    return this.menuItemsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete menu item' })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.menuItemsService.remove(id);
  }
}

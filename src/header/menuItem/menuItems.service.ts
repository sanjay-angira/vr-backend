import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Menu } from 'src/entities/CMS/header/menu.entity';
import { MenuItem } from 'src/entities/CMS/header/menu-item.entity';
import { successResponse } from 'src/commonServices/response.service';
import { CreateMenuItemDto, UpdateMenuItemDto } from 'src/dto/header.dto';

@Injectable()
export class MenuItemsService {
  constructor(
    @InjectRepository(Menu)
    private readonly menuRepo: Repository<Menu>,
    @InjectRepository(MenuItem)
    private readonly menuItemRepo: Repository<MenuItem>,
  ) {}

  private toPayload(item: MenuItem) {
    return {
      id: item.id,
      menuId: item.menuId,
      parentId: item.parentId,
      label: item.label,
      url: item.url,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private async validateParent(
    menuId: number,
    parentId?: number | null,
    currentId?: number,
  ) {
    if (!parentId) {
      return;
    }

    if (currentId && parentId === currentId) {
      throw new BadRequestException('A menu item cannot be its own parent');
    }

    const parent = await this.menuItemRepo.findOne({
      where: { id: parentId, menuId },
    });

    if (!parent) {
      throw new BadRequestException('Parent menu item not found in this menu');
    }
  }

  async create(dto: CreateMenuItemDto) {
    const menu = await this.menuRepo.findOne({ where: { id: dto.menuId } });
    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    await this.validateParent(dto.menuId, dto.parentId);

    const item = this.menuItemRepo.create({
      ...dto,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
    });
    const saved = await this.menuItemRepo.save(item);
    return successResponse(
      this.toPayload(saved),
      'Menu item created successfully',
      201,
    );
  }

  async update(id: number, dto: UpdateMenuItemDto) {
    const item = await this.menuItemRepo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    const menuId = dto.menuId ?? item.menuId;
    const parentId = dto.parentId === undefined ? item.parentId : dto.parentId;

    if (dto.menuId && dto.menuId !== item.menuId) {
      const menu = await this.menuRepo.findOne({ where: { id: dto.menuId } });
      if (!menu) {
        throw new NotFoundException('Menu not found');
      }
    }

    await this.validateParent(menuId, parentId, id);
    Object.assign(item, dto);
    const saved = await this.menuItemRepo.save(item);
    return successResponse(
      this.toPayload(saved),
      'Menu item updated successfully',
    );
  }

  async remove(id: number) {
    const item = await this.menuItemRepo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException('Menu item not found');
    }
    await this.menuItemRepo.remove(item);
    return successResponse(null, 'Menu item deleted successfully');
  }
}

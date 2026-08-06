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
import { CreateMenuDto, UpdateMenuDto } from 'src/dto/header.dto';

export type PublicMenuItemNode = {
  id: number;
  label: string;
  url: string;
  children: PublicMenuItemNode[];
};

@Injectable()
export class MenusService {
  constructor(
    @InjectRepository(Menu)
    private readonly menuRepo: Repository<Menu>,
    @InjectRepository(MenuItem)
    private readonly menuItemRepo: Repository<MenuItem>,
  ) {}

  private mapMenuItemAdmin(item: MenuItem) {
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

  buildMenuTree(
    items: MenuItem[],
    parentId: number | null = null,
  ): PublicMenuItemNode[] {
    return items
      .filter((item) => item.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
      .map((item) => ({
        id: item.id,
        label: item.label,
        url: item.url,
        children: this.buildMenuTree(items, item.id),
      }));
  }

  async findAllForAdmin() {
    const menus = await this.menuRepo.find({ order: { id: 'ASC' } });
    const allItems = await this.menuItemRepo.find({
      order: { sortOrder: 'ASC', id: 'ASC' },
    });

    const payload = menus.map((menu) => ({
      id: menu.id,
      name: menu.name,
      slug: menu.slug,
      isActive: menu.isActive,
      createdAt: menu.createdAt,
      updatedAt: menu.updatedAt,
      items: allItems
        .filter((item) => item.menuId === menu.id)
        .map((item) => this.mapMenuItemAdmin(item)),
    }));

    return successResponse(payload, 'Menus retrieved successfully');
  }

  async getActiveMenuTree(activeMenuId?: number | null) {
    let menu: Menu | null = null;

    if (activeMenuId) {
      menu = await this.menuRepo.findOne({
        where: { id: activeMenuId, isActive: true },
      });
    }

    if (!menu) {
      menu = await this.menuRepo.findOne({
        where: { slug: 'header', isActive: true },
      });
    }

    if (!menu) {
      menu = await this.menuRepo.findOne({
        where: { isActive: true },
        order: { id: 'ASC' },
      });
    }

    if (!menu) {
      return [];
    }

    const items = await this.menuItemRepo.find({
      where: { menuId: menu.id, isActive: true },
      order: { sortOrder: 'ASC', id: 'ASC' },
    });

    return this.buildMenuTree(items);
  }

  async create(dto: CreateMenuDto) {
    const existing = await this.menuRepo.findOne({ where: { slug: dto.slug } });
    if (existing) {
      throw new BadRequestException('Menu slug already exists');
    }

    const menu = this.menuRepo.create(dto);
    const saved = await this.menuRepo.save(menu);
    return successResponse(
      {
        id: saved.id,
        name: saved.name,
        slug: saved.slug,
        isActive: saved.isActive,
        items: [],
      },
      'Menu created successfully',
      201,
    );
  }

  async update(id: number, dto: UpdateMenuDto) {
    const menu = await this.menuRepo.findOne({ where: { id } });
    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    if (dto.slug && dto.slug !== menu.slug) {
      const existing = await this.menuRepo.findOne({
        where: { slug: dto.slug },
      });
      if (existing) {
        throw new BadRequestException('Menu slug already exists');
      }
    }

    Object.assign(menu, dto);
    const saved = await this.menuRepo.save(menu);
    return successResponse(
      {
        id: saved.id,
        name: saved.name,
        slug: saved.slug,
        isActive: saved.isActive,
      },
      'Menu updated successfully',
    );
  }

  async remove(id: number) {
    const menu = await this.menuRepo.findOne({ where: { id } });
    if (!menu) {
      throw new NotFoundException('Menu not found');
    }
    await this.menuRepo.remove(menu);
    return successResponse(null, 'Menu deleted successfully');
  }
}

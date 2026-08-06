import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Param,
  ParseIntPipe,
  Headers,
} from '@nestjs/common';
import { ModulesService } from './modules.service';
import {
  CreateModuleDto,
  DeleteCategoryDto,
  UpdateCategoryDto,
  UpdateModuleCategoryNameDto,
  UpdateModuleDto,
  UpdateModulesCategoryOrderDto,
  UpdateModulesOrderDto,
} from '../dto/module.dto';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { PaginationDto } from '../dto/common.dto';

@ApiTags('modules')
@Controller('modules')
export class ModulesController {
  constructor(private modulesService: ModulesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new module' })
  @ApiBody({
    type: CreateModuleDto,
    examples: {
      example1: {
        summary: 'Example module',
        value: {
          name: 'Module Name',
          router_link: '/module-link',
          icon: 'module-icon',
          isActive: true,
          categories: 'module-categories',
          categoryOrderNo: 1,
          order: 1,
        },
      },
    },
  })
  async createModule(@Body() createModuleDto: CreateModuleDto) {
    return this.modulesService.createModule(createModuleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all modules' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'pageNumber', required: false, type: String })
  @ApiQuery({ name: 'pageSize', required: false, type: String })
  @ApiQuery({ name: 'column', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, type: String })
  async getAllModules(
    @Query() paginationDto: PaginationDto,
    @Headers('authorization') authorization?: string,
  ) {
    return this.modulesService.getAllModules(paginationDto, authorization);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a module by ID' })
  @ApiParam({ name: 'id', required: true, type: Number })
  async getModuleById(@Param('id', ParseIntPipe) id: number) {
    return this.modulesService.getModuleById(id);
  }

  @Put('update-modules-category-name')
  @ApiOperation({ summary: 'Rename a modules category' })
  @ApiBody({
    type: UpdateModuleCategoryNameDto,
    examples: {
      example1: {
        summary: 'Example category name update',
        value: {
          oldCategory: 'Dashboard',
          newCategory: 'Dashboard Updated',
          category_icon: 'new-category-icon',
        },
      },
    },
  })
  async updateModulesCategoryName(@Body() dto: UpdateModuleCategoryNameDto) {
    return this.modulesService.updateModulesCategoryName(dto);
  }

  @Put('update-modules-category-order')
  @ApiOperation({ summary: 'Update modules category order' })
  @ApiBody({
    type: UpdateModulesCategoryOrderDto,
    examples: {
      example1: {
        summary: 'Example category order update',
        value: {
          categories: [
            {
              category: 'Products',
              order: 1,
            },
            {
              category: 'Dashboard',
              order: 2,
            },
            {
              category: 'Users',
              order: 3,
            },
            {
              category: 'Blog',
              order: 4,
            },
            {
              category: 'CSM',
              order: 5,
            },
            {
              category: 'Settings',
              order: 6,
            },
          ],
        },
      },
    },
  })
  async updateModulesCategoryOrder(@Body() dto: UpdateModulesCategoryOrderDto) {
    return this.modulesService.updateModulesCategoryOrder(dto);
  }

  @Put('update-modules-order')
  @ApiOperation({ summary: 'Update modules order' })
  @ApiBody({
    type: UpdateModulesOrderDto,
    examples: {
      example1: {
        summary: 'Example modules order update',
        value: {
          modules: [
            {
              id: 13,
              order: 1,
              category: 'Products',
            },
            {
              id: 4,
              order: 2,
              category: 'Products',
            },
            {
              id: 2,
              order: 3,
              category: 'Products',
            },
            {
              id: 5,
              order: 4,
              category: 'Products',
            },
            {
              id: 7,
              order: 5,
              category: 'Products',
            },
            {
              id: 6,
              order: 6,
              category: 'Products',
            },
            {
              id: 12,
              order: 7,
              category: 'Products',
            },
          ],
        },
      },
    },
  })
  async updateModulesOrder(@Body() dto: UpdateModulesOrderDto) {
    return this.modulesService.updateModulesOrder(dto);
  }

  @Delete('delete-modules-category')
  @ApiOperation({ summary: 'Delete a modules category' })
  @ApiQuery({
    name: 'category',
    required: true,
    type: String,
    description: 'Name of the category to delete',
  })
  async deleteModulesCategory(@Query() dto: DeleteCategoryDto) {
    return this.modulesService.deleteModulesCategory(dto);
  }

  @Put(':moduleId/updateCategory')
  @ApiOperation({ summary: 'Update a module category' })
  @ApiParam({ name: 'moduleId', required: true, type: Number })
  async updateModuleCategory(
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.modulesService.updateModuleCategory(moduleId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a module' })
  @ApiBody({
    type: UpdateModuleDto,
    examples: {
      example1: {
        summary: 'Example module',
        value: {
          name: 'Module Name',
          router_link: '/module-link',
          icon: 'module-icon',
          isActive: true,
          categories: 'module-categories',
        },
      },
    },
  })
  async updateModule(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateModuleDto: UpdateModuleDto,
  ) {
    return this.modulesService.updateModule(id, updateModuleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a module' })
  async deleteModule(@Param('id', ParseIntPipe) id: number) {
    return this.modulesService.deleteModule(id);
  }
}

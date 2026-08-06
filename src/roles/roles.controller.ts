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
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto } from '../dto/role.dto';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { PaginationDto } from '../dto/common.dto';

@ApiTags('roles')
@Controller('roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new role' })
  @ApiBody({
    type: CreateRoleDto,
    examples: {
      example1: {
        summary: 'Example role',
        value: {
          roleId: 1,
          roleName: 'Admin',
        },
      },
    },
  })
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.createRole(createRoleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all roles' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'pageNumber', required: false, type: String })
  @ApiQuery({ name: 'pageSize', required: false, type: String })
  @ApiQuery({ name: 'column', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, type: String })
  async getAllRoles(@Query() paginationDto: PaginationDto) {
    return this.rolesService.getAllRoles(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a role by ID' })
  @ApiParam({ name: 'id', required: true, type: Number })
  async getRoleById(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.getRoleById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a role' })
  @ApiBody({
    type: UpdateRoleDto,
    examples: {
      example1: {
        summary: 'Example role update',
        value: {
          roleId: 1,
          roleName: 'Admin',
        },
      },
    },
  })
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.updateRole(id, updateRoleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a role' })
  async deleteRole(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.deleteRole(id);
  }
}

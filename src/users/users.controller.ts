import {
  Controller,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Get,
  Put,
  Delete,
  Query,
  Patch,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';
import {
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import { PaginationDto } from '../dto/common.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  @ApiBody({
    type: CreateUserDto,
    examples: {
      example1: {
        value: {
          firstName: 'Rahul',
          lastName: 'Sharma',
          email: 'rahul.sharma@yopmail.com',
          phoneNumber: '9876543211',
          profileImage: 'https://example.com/uploads/users/rahul.jpg',
          roleIds: [1, 2],
          isActive: true,
        },
      },
    },
  })
  @ApiOperation({ summary: 'Create a new user' })
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @Get('template/permissions')
  @ApiOperation({
    summary: 'Get blank module permissions template for user permissions',
  })
  async getPermissionTemplate() {
    return this.usersService.getPermissionTemplate();
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiQuery({ name: 'pageNumber', required: false, type: String })
  @ApiQuery({ name: 'pageSize', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'column', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, type: String })
  async getAllUsers(@Query() peginationDto: PaginationDto) {
    return this.usersService.getAllUsers(peginationDto);
  }

  @Get('delete-requests')
  @ApiOperation({ summary: 'Get users with delete request' })
  async getDeleteRequestedUsers() {
    return this.usersService.getDeleteRequestedUsers();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', required: true, type: Number })
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUserById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiParam({ name: 'id', required: true, type: Number })
  @ApiBody({
    type: UpdateUserDto,
    examples: {
      example1: {
        value: {
          firstName: 'Rahul',
          lastName: 'Sharma',
          email: 'rahul.sharma@yopmail.com',
          phoneNumber: '9876543211',
          profileImage: 'https://example.com/uploads/users/rahul.jpg',
          roleIds: [1, 2],
          isActive: true,
        },
      },
    },
  })
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(id, updateUserDto);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate user by ID' })
  @ApiParam({ name: 'id', required: true, type: Number })
  async deactivateUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deactivateUser(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiParam({ name: 'id', required: true, type: Number })
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deleteUser(id);
  }
}

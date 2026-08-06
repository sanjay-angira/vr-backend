import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User } from '../entities/user/user.entity';
import { Role } from '../entities/user/role.entity';
import { UserRole } from '../entities/user/userRole.entity';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';
import { PaginationDto } from 'src/dto/common.dto';
import { PasswordService } from 'src/commonServices/password.service';
import {
  errorResponse,
  successResponse,
} from 'src/commonServices/response.service';
import { UserTokenService } from 'src/commonServices/userToken.service';
import { UtilityService } from 'src/commonServices/utility.service';
import { NodemailerService } from 'src/commonServices/nodemailer.service';
import { EmailTemplate } from 'src/commonServices/emailTempaltes/Emailtemplate';
import { ConfigService } from '@nestjs/config';
import { UserPermissionsService } from 'src/permissions/user-permissions.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private userRolesRepository: Repository<UserRole>,
    private passwordService: PasswordService,
    private userTokenService: UserTokenService,
    private utilityService: UtilityService,
    private nodemailerService: NodemailerService,
    private emailTemplate: EmailTemplate,
    private configService: ConfigService,
    private userPermissionsService: UserPermissionsService,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<any> {
    try {
      if (createUserDto.profileImage === '') {
        delete createUserDto.profileImage;
      }
      // Check if user with email already exists
      const findUserByEmail = await this.usersRepository.findOne({
        where: { email: createUserDto.email, emailVerified: true },
      });

      const findUserByPhoneNumber = await this.usersRepository.findOne({
        where: { phoneNumber: createUserDto.phoneNumber },
      });

      if (findUserByEmail) {
        return errorResponse('User with this email already exists', 400);
      }

      if (findUserByPhoneNumber) {
        return errorResponse('User with this Phone number already exists', 400);
      }

      const roles = await this.rolesRepository.find({
        where: createUserDto.roleIds.map((id) => ({ id })),
      });

      if (roles.length !== createUserDto.roleIds.length) {
        return errorResponse('One or more roleIds are invalid', 400);
      }

      // Create user object
      const user = new User();
      Object.assign(user, createUserDto);
      delete (
        user as Partial<User> & { roleIds?: number[]; permissions?: any[] }
      ).roleIds;
      delete (
        user as Partial<User> & { roleIds?: number[]; permissions?: any[] }
      ).permissions;
      const savedUser = await this.usersRepository.save(user);
      const userRoles = roles.map((role) =>
        this.userRolesRepository.create({
          user: savedUser,
          role,
        }),
      );

      await this.userRolesRepository.save(userRoles);
      await this.userPermissionsService.updatePermissionsForUser(
        savedUser.id,
        createUserDto.permissions || [],
      );

      const userWithRoles = await this.usersRepository.findOne({
        where: { id: savedUser.id },
        relations: ['userRoles', 'userRoles.role'],
      });

      if (!userWithRoles) {
        return errorResponse('Failed to load created user roles', 500);
      }

      const emailSent = await this.sendSetPasswordEmail(userWithRoles);

      const responseUser = await this.findById(savedUser.id);

      return successResponse(
        { responseUser, emailSent },
        emailSent
          ? 'User created successfully and set-password email sent'
          : 'User created successfully',
      );
    } catch (error) {
      return errorResponse('Failed to create user', 500);
    }
  }

  async getPermissionTemplate(): Promise<any> {
    try {
      const permissions =
        await this.userPermissionsService.getPermissionTemplate();
      return successResponse(
        permissions,
        'Permission template fetched successfully',
      );
    } catch (error) {
      return errorResponse('Failed to fetch permission template', 500);
    }
  }

  async getAllUsers(peginationDto: PaginationDto): Promise<any> {
    const {
      pageNumber,
      pageSize,
      search,
      column = 'id',
      order = 'DESC',
    } = peginationDto;

    const isPageNumberValid =
      this.utilityService.validatePageNumber(pageNumber);
    const isPageSizeValid = this.utilityService.validatePageSize(pageSize);
    const isSearchValid = this.utilityService.validateSearch(search);

    try {
      const queryBuilder = this.usersRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.userRoles', 'userRoles')
        .leftJoinAndSelect('userRoles.role', 'role');

      // Search filters
      if (isSearchValid) {
        queryBuilder.andWhere(
          `(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search OR user.phoneNumber ILIKE :search)`,
          { search: `%${search}%` },
        );
      }

      // Ordering
      const validColumns = [
        'id',
        'firstName',
        'lastName',
        'email',
        'createdAt',
        'updatedAt',
      ];
      const orderColumn = validColumns.includes(column) ? column : 'id';
      queryBuilder.orderBy(
        `user.${orderColumn}`,
        order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC',
      );

      // Count total before pagination
      const count = await queryBuilder.getCount();

      if (isPageNumberValid && isPageSizeValid) {
        const skip = (Number(pageNumber) - 1) * Number(pageSize);
        queryBuilder.skip(skip).take(Number(pageSize));
      }

      const rows = await queryBuilder.getMany();

      return successResponse({ rows, count }, 'Users fetched successfully');
    } catch (error) {
      return errorResponse('Failed to fetch users', 500);
    }
  }

  async getUserById(id: number): Promise<any> {
    try {
      const user = await this.findById(id);
      if (!user) {
        return errorResponse('User not found', 404);
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      return successResponse(userWithoutPassword, 'User fetched successfully');
    } catch (error) {
      return errorResponse('Failed to fetch user', 500);
    }
  }

  async getDeleteRequestedUsers(): Promise<any> {
    try {
      const users = await this.usersRepository.find({
        where: { isDeleteRequested: true },
        relations: ['userRoles', 'userRoles.role'],
        order: { id: 'DESC' },
      });

      const rows = users.map((user) => {
        const { password, ...userWithoutPassword } = user;

        return {
          ...userWithoutPassword,
          userRoles:
            user.userRoles?.map((userRole) => ({
              ...userRole,
              roleId: userRole.role?.id,
              roleName: userRole.role?.roleName,
            })) || [],
        };
      });

      return successResponse(
        { rows, count: rows.length },
        'Delete requested users fetched successfully',
      );
    } catch (error) {
      return errorResponse('Failed to fetch delete requested users', 500);
    }
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<any> {
    try {
      const user = await this.usersRepository.findOne({
        where: { id },
        relations: ['userRoles', 'userRoles.role'],
      });

      if (!user) {
        return errorResponse('User not found', 404);
      }

      const previousHadRoleOne =
        user.userRoles?.some((userRole) => userRole.role?.roleId === 1) ||
        false;

      if (updateUserDto.email && updateUserDto.email !== user.email) {
        const existingUserWithEmail = await this.usersRepository.findOne({
          where: { email: updateUserDto.email, emailVerified: true },
        });

        if (existingUserWithEmail && existingUserWithEmail.id !== id) {
          return errorResponse('User with this email already exists', 400);
        }
      }

      if (
        updateUserDto.phoneNumber &&
        updateUserDto.phoneNumber !== user.phoneNumber
      ) {
        const existingUserWithPhoneNumber = await this.usersRepository.findOne({
          where: { phoneNumber: updateUserDto.phoneNumber },
        });

        if (
          existingUserWithPhoneNumber &&
          existingUserWithPhoneNumber.id !== id
        ) {
          return errorResponse(
            'User with this Phone number already exists',
            400,
          );
        }
      }

      if (updateUserDto.profileImage === '') {
        user.profileImage = null as unknown as string;
        delete (updateUserDto as Partial<UpdateUserDto>).profileImage;
      }

      // Update user fields
      Object.assign(user, updateUserDto);
      delete (
        user as Partial<User> & { roleIds?: number[]; permissions?: any[] }
      ).roleIds;
      delete (
        user as Partial<User> & { roleIds?: number[]; permissions?: any[] }
      ).permissions;

      await this.usersRepository.save(user);

      if (updateUserDto.roleIds) {
        const roles = await this.rolesRepository.find({
          where: updateUserDto.roleIds.map((roleId) => ({ id: roleId })),
        });

        if (roles.length !== updateUserDto.roleIds.length) {
          return errorResponse('One or more roleIds are invalid', 400);
        }

        await this.userRolesRepository.delete({ user: { id } });

        const userRoles = roles.map((role) =>
          this.userRolesRepository.create({
            user,
            role,
          }),
        );

        await this.userRolesRepository.save(userRoles);
      }

      if (updateUserDto.permissions) {
        await this.userPermissionsService.updatePermissionsForUser(
          id,
          updateUserDto.permissions,
        );
      }

      const updatedUser = await this.usersRepository.findOne({
        where: { id },
        relations: ['userRoles', 'userRoles.role'],
      });

      if (!updatedUser) {
        return errorResponse('User not found', 404);
      }

      const hasRoleOneNow =
        updatedUser.userRoles?.some(
          (userRole) => userRole.role?.roleId === 1,
        ) || false;
      const shouldSendSetPasswordEmail = !previousHadRoleOne && hasRoleOneNow;

      if (shouldSendSetPasswordEmail) {
        await this.sendSetPasswordEmail(updatedUser);
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;

      return successResponse(
        { ...userWithoutPassword, emailSent: shouldSendSetPasswordEmail },
        shouldSendSetPasswordEmail
          ? 'User updated successfully and set-password email sent'
          : 'User updated successfully',
      );
    } catch (error) {
      return errorResponse('Failed to update user', 500);
    }
  }

  async deactivateUser(id: number): Promise<any> {
    try {
      const user = await this.usersRepository.findOne({
        where: { id },
        relations: ['userRoles', 'userRoles.role'],
      });

      if (!user) {
        return errorResponse('User not found', 404);
      }

      user.isActive = false;
      const updatedUser = await this.usersRepository.save(user);

      const { password, ...userWithoutPassword } = updatedUser;

      return successResponse(
        userWithoutPassword,
        'User deactivated successfully',
      );
    } catch (error) {
      return errorResponse('Failed to deactivate user', 500);
    }
  }

  async deleteUser(id: number): Promise<any> {
    try {
      const user = await this.usersRepository.findOne({
        where: { id },
      });

      if (!user) {
        return errorResponse('User not found', 404);
      }

      await this.usersRepository.delete(id);

      return successResponse(null, 'User deleted successfully');
    } catch (error) {
      return errorResponse('Failed to delete user', 500);
    }
  }

  async findById(id: number): Promise<User | undefined> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['userRoles', 'userRoles.role'],
    });
    if (!user) {
      return undefined;
    }

    user.userRoles = user.userRoles.map((userRole) => {
      return {
        ...userRole,
        roleId: userRole.role.id,
        roleName: userRole.role.roleName,
      };
    });
    (user as any).permissions =
      await this.userPermissionsService.getPermissionsForUser(id);
    return user || undefined;
  }

  private async sendSetPasswordEmail(user: User): Promise<boolean> {
    const hasRoleOne =
      user.userRoles?.some((userRole) => userRole.role?.roleId === 1) || false;
    if (!hasRoleOne) {
      return false;
    }

    const accessToken = this.userTokenService.generateAccessToken(user);
    const frontendBaseUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';
    const setPasswordLink = `${frontendBaseUrl}/set-password?token=${encodeURIComponent(accessToken)}`;

    await this.nodemailerService.sendMail({
      to: user.email,
      subject: 'Set your password',
      html: this.emailTemplate.userSetPasswordTemplate({
        title: 'Set your password',
        heading: 'Welcome to Spices',
        userName:
          `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        setPasswordLink,
      }),
    });

    return true;
  }
}

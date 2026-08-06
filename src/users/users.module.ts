import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '../entities/user/user.entity';
import { Role } from '../entities/user/role.entity';
import { UserRole } from '../entities/user/userRole.entity';
import { UserTokenService } from 'src/commonServices/userToken.service';
import { PasswordService } from 'src/commonServices/password.service';
import { Modules } from 'src/entities/user/module.entity';
import { Permissions } from 'src/entities/user/permissions.entity';
import { UtilityService } from 'src/commonServices/utility.service';
import { CommonModule } from 'src/commonServices/common.module';
import { UserPermissionsService } from 'src/permissions/user-permissions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, UserRole, Modules, Permissions]),
    CommonModule,
    JwtModule.register({
      secret: 'your_jwt_secret',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    PasswordService,
    UserTokenService,
    UtilityService,
    UserPermissionsService,
  ],
  exports: [UsersService],
})
export class UsersModule {}

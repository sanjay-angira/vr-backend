import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { User } from 'src/entities/user/user.entity';
import { Role } from 'src/entities/user/role.entity';
import { UserRole } from 'src/entities/user/userRole.entity';
import { Permissions } from 'src/entities/user/permissions.entity';
import { Modules } from 'src/entities/user/module.entity';
import { CommonModule } from 'src/commonServices/common.module';
import { UserPermissionsService } from 'src/permissions/user-permissions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, UserRole, Permissions, Modules]),
    JwtModule.register({
      secret: 'your_jwt_secret',
      signOptions: { expiresIn: '1d' },
    }),
    CommonModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, UserPermissionsService],
  exports: [AuthService],
})
export class AuthModule {}

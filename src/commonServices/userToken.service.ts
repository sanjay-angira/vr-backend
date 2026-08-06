import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../entities/user/user.entity';
import { UserRole } from '../entities/user/userRole.entity';

@Injectable()
export class UserTokenService {
  constructor(private readonly jwtService: JwtService) {}

  generateAccessToken(user: User): string {
    const userForToken = {
      userRes: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        userRoles:
          user.userRoles?.map((userRole) => ({
            id: userRole.id,
            roleName: userRole.role?.roleName,
            roleId: userRole.role?.id,
          })) || [],
      },
    };

    return this.jwtService.sign(userForToken, { expiresIn: '15m' });
  }

  generateRefreshToken(user: User): string {
    const payload = { id: user.id };
    return this.jwtService.sign(payload, { expiresIn: '7d' });
  }

  verifyAccessToken(token: string): any {
    return this.jwtService.verify(token);
  }

  verifyRefreshToken(token: string): any {
    return this.jwtService.verify(token);
  }
}

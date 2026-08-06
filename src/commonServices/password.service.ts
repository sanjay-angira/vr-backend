import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordService {
  async encode(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }

  async decode(
    password: string,
    hashedPassword: string | null,
  ): Promise<boolean> {
    if (!hashedPassword) return false;
    return bcrypt.compare(password, hashedPassword);
  }
}

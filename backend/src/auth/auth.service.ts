import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { JwtAuthGuard } from './guards/auth-jwt.guard';
import { JwtService } from '@nestjs/jwt';
@Injectable()
export class AuthService {
  constructor(private usersService: UsersService,
              private jwtService: JwtService,
            ) {}

  async register(data: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await this.usersService.create({
      ...data,
      password: hashedPassword,
    });
     const {password, ...result} = user;
     return result;
  }

  async validateUser(username: string, password: string) {
    const user = await this.usersService.findByUsername(username);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(username: string, password: string) {
    const user = await this.validateUser(username, password);

    const payload={
      sub : user.id,
      username : user.username,
      role : user.role
    };

    const {password: _, ...safeUser} = user;

    return {
      accessToken : this.jwtService.sign(payload),
      user : safeUser
    }
  }
}
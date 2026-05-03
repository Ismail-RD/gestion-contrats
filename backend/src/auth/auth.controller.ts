import { Body, Controller, Post, UseGuards,Get,Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/auth-jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() data: CreateUserDto) {
    return this.authService.register(data);
  }

  @Post('login')
  login(@Body() data: LoginDto) {
    return this.authService.login(data.username, data.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  profile(@Req() req: any){
       return req.user;
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  Delete,
  Request,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { JwtAuthGuard } from '../auth/guards/auth-jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

type RequestWithUser = {
  user: {
    id: number;
    role: UserRole;
  };
};

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  invite(@Body() dto: InviteUserDto) {
    return this.usersService.inviteByAdmin(dto);
  }

  @Patch(':id/role')
  updateRole(
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: UpdateUserRoleDto,
  @Request() req: RequestWithUser,
) {
  return this.usersService.updateRole(id, dto.role, req.user.id);
}

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    return this.usersService.remove(id, req.user.id);
  }
}

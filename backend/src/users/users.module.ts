import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { UserInvitation } from './entities/user-invitation.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../mail/mail.module';

@Module({
  imports : [TypeOrmModule.forFeature([User, UserInvitation]), MailModule],
  providers: [UsersService],
  controllers: [UsersController],
  exports : [UsersService],
})
export class UsersModule {}

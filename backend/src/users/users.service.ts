import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { Repository } from 'typeorm';

import { UserRole } from '../common/enums/user-role.enum';
import { MailService } from '../mail/mail.service';
import { CreateUserDto } from './dto/create-user.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { UserInvitation } from './entities/user-invitation.entity';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(UserInvitation)
    private invitationRepo: Repository<UserInvitation>,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  create(data: CreateUserDto) {
    const user = this.userRepo.create(data);
    return this.userRepo.save(user);
  }

  findByUsername(username: string) {
    return this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.username = :username', { username })
      .getOne();
  }

  findById(id: number) {
    return this.userRepo.findOne({ where: { id } });
  }

  async findAll() {
    return this.userRepo.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async inviteByAdmin(data: InviteUserDto) {
    const email = data.email.trim().toLowerCase();
    const existingUser = await this.userRepo.findOne({ where: { email } });

    if (existingUser) {
      throw new ConflictException('Un compte existe deja avec cet email');
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const existingInvitation = await this.invitationRepo.findOne({
      where: { email },
    });

    const invitation =
      existingInvitation ??
      this.invitationRepo.create({
        email,
        role: UserRole.USER,
      });

    invitation.tokenHash = this.hashInvitationToken(token);
    invitation.expiresAt = expiresAt;
    invitation.acceptedAt = null;

    await this.invitationRepo.save(invitation);

    const registrationUrl = this.buildRegistrationUrl(token);
    const emailSent = await this.mailService.sendUserInvitation(
      email,
      registrationUrl,
      expiresAt,
    );

    return {
      email,
      emailSent,
      registrationUrl,
    };
  }

  async completeInvitation(data: {
    token: string;
    username: string;
    password: string;
  }) {
    const invitation = await this.invitationRepo.findOne({
      where: { tokenHash: this.hashInvitationToken(data.token) },
    });

    if (
      !invitation ||
      invitation.acceptedAt ||
      invitation.expiresAt < new Date()
    ) {
      throw new BadRequestException("Lien d'invitation invalide ou expire");
    }

    const username = data.username.trim();

    if (username.length < 3) {
      throw new BadRequestException(
        "Le nom d'utilisateur doit contenir au moins 3 caracteres",
      );
    }

    const existingUsername = await this.userRepo.findOne({
      where: { username },
    });

    if (existingUsername) {
      throw new ConflictException("Nom d'utilisateur deja utilise");
    }

    const existingEmail = await this.userRepo.findOne({
      where: { email: invitation.email },
    });

    if (existingEmail) {
      throw new ConflictException('Un compte existe deja avec cet email');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = this.userRepo.create({
      fullName: username,
      username,
      email: invitation.email,
      password: hashedPassword,
      role: invitation.role,
    });

    const savedUser = await this.userRepo.save(user);

    invitation.acceptedAt = new Date();
    await this.invitationRepo.save(invitation);

    const { password, ...safeUser } = savedUser;
    return safeUser;
  }

  async updateRole(id: number, role: UserRole, currentUserId: number) {
    if (id === currentUserId) {
      throw new BadRequestException(
        'Vous ne pouvez pas modifier votre propre role',
      );
    }

    const user = await this.userRepo.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    user.role = role;

    const savedUser = await this.userRepo.save(user);

    const { password, ...safeUser } = savedUser;
    return safeUser;
  }

  async remove(
    id: number,
    currentUserId: number,
  ): Promise<{ message: string }> {
    if (id === currentUserId) {
      throw new BadRequestException(
        'Vous ne pouvez pas supprimer votre propre compte',
      );
    }

    const user = await this.userRepo.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouve');
    }

    await this.userRepo.remove(user);

    return { message: 'Utilisateur supprime avec succes' };
  }

  private buildRegistrationUrl(token: string): string {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';

    return `${frontendUrl.replace(/\/$/, '')}/register/${token}`;
  }

  private hashInvitationToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}

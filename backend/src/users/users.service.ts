import { Injectable,NotFoundException,ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from '../common/enums/user-role.enum';
import * as bycrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
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

  async findAll(){
       return this.userRepo.find({
        order: {
          createdAt: 'DESC',
        },
       });
  }

  async createdByAdmin(data: CreateUserDto) {
    const existingUsername = await this.userRepo.findOne({ where: { username: data.username } });

    if (existingUsername) {
      throw new ConflictException('Nom d\'utilisateur déjà utilisé');
    }

    const hashedPassword = await bycrypt.hash(data.password, 10);

    const user = this.userRepo.create({
      ...data,
      password: hashedPassword,
      role: data.role ?? UserRole.USER,
    });

    const savedUser = await this.userRepo.save(user);

    const { password, ...safeUser } = savedUser;
    return safeUser;
  }

async updateRole(
  id: number,
  role: UserRole,
  currentUserId: number,
) {
  if (id === currentUserId) {
    throw new BadRequestException(
      'Vous ne pouvez pas modifier votre propre rôle',
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
  
  async remove(id:number,currentUserId:number): Promise<{ message: string }> {
    if (id === currentUserId) {
      throw new BadRequestException('Vous ne pouvez pas supprimer votre propre compte');
    }
    const user = await this.userRepo.findOne({ where: { id } });

    if (!user){
      throw new NotFoundException('Utilisateur non trouvé');
    }

    await this.userRepo.remove(user);

    return { message: 'Utilisateur supprimé avec succès' };
  }
}
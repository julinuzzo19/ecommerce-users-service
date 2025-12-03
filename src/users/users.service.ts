import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto, UpdateUserDto } from 'src/users/user.dto';
import { User } from 'src/users/user.entity';
import { Not, Repository } from 'typeorm';
import { unlink } from 'fs/promises';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    const userFound = await this.usersRepository.findOne({ where: { id } });

    if (!userFound) {
      throw new NotFoundException();
    }

    return userFound;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { email } });
  }

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(createUserDto);
    return await this.usersRepository.save(user);
  }

  async updateUser(userId: string, updateData: UpdateUserDto): Promise<User> {
    const user = await this.findById(userId);

    const updatedUser = this.usersRepository.merge(user, updateData);

    return await this.usersRepository.save(updatedUser);
  }

  async uploadAvatar(id: string, file: Express.Multer.File) {
    // prop avatar is not null in where
    const result = await this.usersRepository.findOne({
      select: ['avatar'],
      where: { id, avatar: Not(null) },
    });

    if (result[0]?.avatar) {
      try {
        // delete old avatar if exists
        await unlink(`public/${result[0].avatar}`);
      } catch (error) {
        throw new InternalServerErrorException('Error on delete avatar');
      }
    }
    const filePath = `avatars/${file.filename}`;

    await this.usersRepository.update(id, { avatar: filePath });

    return { message: 'Avatar uploaded successfully', statusCode: 200 };
  }
}

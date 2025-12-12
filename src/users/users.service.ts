import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreateUserDto,
  UpdateUserDto,
  UserByEmailResponseDto,
} from 'src/users/user.dto';
import { User } from 'src/users/user.entity';
import { Not, Repository } from 'typeorm';
import { unlink } from 'fs/promises';
import { LoggerService } from 'src/observability/services/logger.service';
import { MetricsService } from 'src/observability/services/metrics.service';
import { withSpan } from 'src/observability/span.helper';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly logger: LoggerService,
    private readonly metrics: MetricsService,
  ) {}

  async findById(id: string): Promise<User | null> {
    const userFound = await this.usersRepository.findOne({ where: { id } });

    if (!userFound) {
      throw new NotFoundException();
    }

    return userFound;
  }

  async findByEmail(email: string): Promise<UserByEmailResponseDto> {
    return withSpan('UsersService.findByEmail', async (span) => {
      span.setAttribute('user.email', email);

      const user = await this.usersRepository.findOne({ where: { email } });

      if (!user) {
        span.setAttribute('user.found', false);
        throw new NotFoundException(`User with email ${email} not found`);
      }

      return {
        userId: user.id,
        email: user.email,
        roles: [user.role],
      };
    });
  }

  async findAll(): Promise<User[]> {
    this.logger.info('Get all users');

    return await this.usersRepository.find();
  }

  async createUser(createUserDto: CreateUserDto): Promise<string> {
    const end = this.metrics.businessOperationDuration.startTimer({
      operation: 'users.insertUser',
      status: 'success', // Puedes cambiar a 'failure' en el catch
    });
    return withSpan('UsersService.createUser', async (span) => {
      try {
        const user = this.usersRepository.create(createUserDto);

        this.logger.info('Creando usuario', { userData: createUserDto });

        await this.usersRepository.save(user);

        // TODO: usar rabbit par publicar evento de usuario creado

        span.setAttribute('user.id', user.id);
        span.setAttribute('user.email', user.email);

        this.metrics.businessOperationsTotal.inc({
          operation: 'users.createUser',
          status: 'success',
        });

        return user.id;
      } catch (error) {
        end({ status: 'failure' }); // Registra el tiempo con status 'failure'

        this.logger.error(
          { error, userData: createUserDto },
          'Error creating user',
        );
        this.metrics.businessOperationsTotal.inc({
          operation: 'users.insertUser',
          status: 'failure',
        });

        span.setAttribute('error', true);
        span.setAttribute('error.message', (error as Error).message);

        throw new BadRequestException('Error creating user', {
          cause: error as Error,
        });
      }
    });
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

    if (result?.avatar) {
      try {
        // delete old avatar if exists
        await unlink(`public/${result[0].avatar}`);
      } catch (error) {
        this.logger.error(
          { error, userId: id, avatar: result.avatar },
          'Error deleting old avatar',
        );
      }
    }
    const filePath = `avatars/${file.filename}`;

    await this.usersRepository.update(id, { avatar: filePath });

    this.logger.info('Avatar uploaded successfully', { userId: id, filePath });

    return { message: 'Avatar uploaded successfully', statusCode: 200 };
  }
}

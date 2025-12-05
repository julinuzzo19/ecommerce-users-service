import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { AuthGuard } from 'src/middlewares/auth.guard';
import { RolesGuard } from 'src/users/roles/roles.guard';
import { CreateUserDto, UpdateUserDto } from 'src/users/user.dto';
import { UsersService } from 'src/users/users.service';
import type { Request } from 'express';
import { AuthOrGatewayGuard } from 'src/middlewares/authOrGateway.guard';
import { GatewayGuard } from 'src/middlewares/gateway.guard';

@UseGuards(RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthOrGatewayGuard)
  @Get('/by-email')
  async findByEmail(@Query('email') email: string) {
    const userFound = await this.usersService.findByEmail(email);

    return userFound;
  }

  @UseGuards(AuthOrGatewayGuard)
  @Get(':id')
  async findById(@Param('id') id: string) {
    console.log('first');
    const userFound = await this.usersService.findById(id);

    return userFound;
  }

  @UseGuards(GatewayGuard)
  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    const newUser = await this.usersService.createUser(createUserDto);
    return newUser;
  }

  @UseGuards(AuthOrGatewayGuard)
  @Patch(':id')
  async updateUser(
    @Param('id') userId: string,
    @Body() updateData: UpdateUserDto,
  ) {
    const updatedUser = await this.usersService.updateUser(userId, updateData);
    return updatedUser;
  }

  @UseGuards(AuthGuard)
  @Post('profile/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 1024 * 1024 * 5 }, // 5MB
      storage: diskStorage({
        destination: 'public/avatars',
        filename: (req, file, cb) => {
          cb(
            null,
            `${new Date().getTime()}.${file.originalname.split('.')[1]}`,
          );
        },
      }),
      fileFilter(req, file, callback) {
        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
          return callback(
            new BadRequestException(
              'Only JPG, PNG, and JPEG files are allowed!',
            ),
            false,
          );
        } else {
          return callback(null, true);
        }
      },
    }),
  )
  uploadAvatar(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    const userId = req.user.sub;

    return this.usersService.uploadAvatar(userId, file);
  }
}

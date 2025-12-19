import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard } from 'src/users/roles/roles.guard';
import { CreateUserDto, UpdateUserDto } from 'src/users/user.dto';
import { UsersService } from 'src/users/users.service';

@UseGuards(RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/by-email')
  async findByEmail(@Query('email') email: string) {
    const userFound = await this.usersService.findByEmail(email);

    return userFound;
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const userFound = await this.usersService.findById(id);

    return userFound;
  }

  @Get()
  async findAll() {
    return await this.usersService.findAll();
  }

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    const newUser = await this.usersService.createUser(createUserDto);
    return newUser;
  }

  @Patch(':id')
  async updateUser(
    @Param('id') userId: string,
    @Body() updateData: UpdateUserDto,
  ) {
    const updatedUser = await this.usersService.updateUser(userId, updateData);
    return updatedUser;
  }

  // @Post('profile/avatar')
  // @UseInterceptors(
  //   FileInterceptor('file', {
  //     limits: { fileSize: 1024 * 1024 * 5 }, // 5MB
  //     storage: diskStorage({
  //       destination: 'public/avatars',
  //       filename: (req, file, cb) => {
  //         cb(
  //           null,
  //           `${new Date().getTime()}.${file.originalname.split('.')[1]}`,
  //         );
  //       },
  //     }),
  //     fileFilter(req, file, callback) {
  //       if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
  //         return callback(
  //           new BadRequestException(
  //             'Only JPG, PNG, and JPEG files are allowed!',
  //           ),
  //           false,
  //         );
  //       } else {
  //         return callback(null, true);
  //       }
  //     },
  //   }),
  // )
  // uploadAvatar(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
  //   const userId = req.user.sub;

  //   return this.usersService.uploadAvatar(userId, file);
  // }
}

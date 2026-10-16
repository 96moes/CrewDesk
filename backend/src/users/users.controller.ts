// src/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { MANAGEMENT_ROLES } from '../auth/role-sets';
import { UserRole } from './entities/user.entity';

interface RequestWithUser extends Request {
  user: {
    userId: string;
    username: string;
    role: UserRole;
  };
}

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ---------- Self endpoints ----------

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: RequestWithUser) {
    return this.usersService.findOne(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/profile')
  getProfile(@Req() req: RequestWithUser) {
    return this.usersService.getProfile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/projects')
  getMyProjects(@Req() req: RequestWithUser) {
    return this.usersService.getMyProjects(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/tasks')
  getMyTasks(@Req() req: RequestWithUser) {
    return this.usersService.getMyTasks(req.user.userId);
  }

  // ---------- Management support ----------

  /**
   * The id/username list the project and task forms need to offer a picker.
   *
   * Open to every management role, unlike the account endpoints below: it carries no account
   * details, and a manager who may assign a project or a task has to be able to name its owner.
   * It therefore must not grow fields — a manager who needs them needs account access, which is
   * exactly what the ADMIN-only routes below withhold.
   *
   * Declared before `:id`, or that route would swallow it.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGEMENT_ROLES)
  @Get('directory')
  findDirectory() {
    return this.usersService.findDirectory();
  }

  // ---------- Admin ----------
  //
  // User accounts are the one thing a MANAGER cannot touch: these five routes are
  // @Roles(UserRole.ADMIN) on purpose while the rest of the API accepts MANAGEMENT_ROLES.

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}

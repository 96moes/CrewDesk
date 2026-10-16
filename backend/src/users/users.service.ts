// src/users/users.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Project } from '../projects/entities/project.entity';
import { Task } from '../tasks/entities/task.entity';

/**
 * What every user endpoint returns: the account fields, never the password, plus the ids of the
 * groups the user belongs to. The membership rows themselves stay on the server.
 */
export type UserResponse = Omit<User, 'password' | 'memberships'> & {
  groupIds: string[];
};

/**
 * The id/username pair behind every user picker (project manager, task assignee).
 *
 * Deliberately narrower than UserResponse: it is the one user listing a MANAGER may read, so it
 * carries nothing but what an account is called. See UsersController.findDirectory.
 */
export type UserDirectoryEntry = Pick<User, 'id' | 'username'>;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,

    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,

    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponse> {
    const existingUser = await this.usersRepository.findOne({
      where: { username: createUserDto.username },
    });
    if (existingUser) {
      throw new ConflictException('نام کاربری قبلاً استفاده شده است');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    const saved = await this.usersRepository.save(user);
    return this.toUserResponse(saved);
  }

  async findAll(): Promise<UserResponse[]> {
    const users = await this.usersRepository.find({
      relations: { memberships: true },
    });
    return users.map((user) => this.toUserResponse(user));
  }

  /**
   * Every account as an id/username pair, for the pickers on the project and task pages.
   *
   * No relations and no other columns: see UserDirectoryEntry.
   */
  async findDirectory(): Promise<UserDirectoryEntry[]> {
    return this.usersRepository.find({
      select: { id: true, username: true },
      order: { username: 'ASC' },
    });
  }

  async findOne(id: string): Promise<UserResponse> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: { memberships: true },
    });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return this.toUserResponse(user);
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponse> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: { memberships: true },
    });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);

    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt(10);
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, salt);
    }

    const updatedUser = await this.usersRepository.save({
      ...user,
      ...updateUserDto,
    });
    return this.toUserResponse(updatedUser);
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const res = await this.usersRepository.delete(id);
    if (!res.affected) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return { success: true };
  }

  // ---------- Dashboard helpers ----------

  /** User profile: the account fields plus the ids of the groups they belong to. */
  async getProfile(id: string): Promise<UserResponse> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: { memberships: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return this.toUserResponse(user);
  }

  /**
   * The API shape of a user.
   *
   * The password never leaves the server, and the group memberships are reduced to the ids the
   * client actually uses. This is the one place that decides that shape, so every endpoint
   * returns the same fields.
   */
  private toUserResponse(user: User): UserResponse {
    const { password, memberships, ...rest } = user;
    return {
      ...rest,
      groupIds: (memberships ?? []).map((membership) => membership.groupId),
    };
  }

  /** Projects where the user is manager OR has at least one task */
  async getMyProjects(userId: string): Promise<Project[]> {
    // Projects where user is manager
    const asManager = await this.projectsRepository.find({
      where: { managerId: userId },
      relations: { manager: true },
    });

    // Projects where user has tasks
    const taskProjectIds = await this.tasksRepository
      .createQueryBuilder('task')
      .select('task.projectId', 'projectId')
      .where('task.assigneeId = :userId', { userId })
      .getRawMany<{ projectId: string }>();

    const ids = taskProjectIds.map((t) => t.projectId);

    const asMember =
      ids.length > 0
        ? await this.projectsRepository
            .createQueryBuilder('project')
            .leftJoinAndSelect('project.manager', 'manager')
            .where('project.id IN (:...ids)', { ids })
            .getMany()
        : [];

    // Deduplicate
    const map = new Map<string, Project>();
    [...asManager, ...asMember].forEach((p) => map.set(p.id, p));
    return Array.from(map.values());
  }

  /** Tasks assigned to the user */
  async getMyTasks(userId: string): Promise<Task[]> {
    return this.tasksRepository.find({
      where: { assigneeId: userId },
      relations: { project: true, assignee: true },
      order: { deadline: 'ASC' },
    });
  }
}

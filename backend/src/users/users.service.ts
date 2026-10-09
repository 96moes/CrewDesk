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

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
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
    const { password, ...result } = saved;
    return result;
  }

  async findAll(): Promise<Omit<User, 'password'>[]> {
    const users = await this.usersRepository.find({
      relations: { manager: true },
    });
    return users.map((u) => {
      const { password, manager, ...rest } = u;
      return {
        ...rest,
        manager: manager
          ? { id: manager.id, username: manager.username }
          : null,
      } as any;
    });
  }

  async findOne(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: { manager: true },
    });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    const { password, manager, ...rest } = user;
    return {
      ...rest,
      manager: manager ? { id: manager.id, username: manager.username } : null,
    } as any;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);

    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt(10);
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, salt);
    }

    const updatedUser = await this.usersRepository.save({
      ...user,
      ...updateUserDto,
    });
    const { password, ...result } = updatedUser;
    return result;
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const res = await this.usersRepository.delete(id);
    if (!res.affected) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return { success: true };
  }

  // ---------- Dashboard helpers ----------

  /** User profile with manager info */
  async getProfile(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: { manager: true },
    });
    if (!user) throw new NotFoundException('User not found');
    const { password, ...rest } = user;
    return rest;
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

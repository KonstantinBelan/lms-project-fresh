import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Group, GroupDocument } from './schemas/group.schema';
import { Logger } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { IGroupsService } from './groups.service.interface';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { UsersService } from '../users/users.service';

const CACHE_TTL = parseInt(process.env.CACHE_TTL ?? '3600', 10);

@Injectable()
export class GroupsService implements IGroupsService {
  private readonly logger = new Logger(GroupsService.name);

  constructor(
    @InjectModel('Group') private groupModel: Model<GroupDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private usersService: UsersService,
  ) {}

  // Создание группы с кэшированием
  async create(createGroupDto: CreateGroupDto): Promise<GroupDocument> {
    this.logger.log(`Создание группы: ${createGroupDto.name}`);
    const group = new this.groupModel({ ...createGroupDto, students: [] });
    const savedGroup = await group.save();

    // Сбрасываем кэш списка групп
    await this.cacheManager.del('groups:all');
    this.logger.debug(`Группа ${savedGroup._id} создана и кэш сброшен`);
    return savedGroup;
  }

  // Получение всех групп с пагинацией и кэшированием
  async findAll(
    skip: number = 0,
    limit: number = 10,
  ): Promise<{ groups: GroupDocument[]; total: number }> {
    const cacheKey = `groups:all:skip:${skip}:limit:${limit}`;
    const cachedResult = await this.cacheManager.get<{
      groups: GroupDocument[];
      total: number;
    }>(cacheKey);
    if (cachedResult) {
      this.logger.debug(
        `Группы найдены в кэше: ${cachedResult.groups.length} из ${cachedResult.total}`,
      );
      return cachedResult;
    }

    const [groups, total] = await Promise.all([
      this.groupModel.find().skip(skip).limit(limit).exec(),
      this.groupModel.countDocuments().exec(),
    ]);
    this.logger.debug(`Найдено ${groups.length} групп из ${total} в БД`);
    const result = { groups, total };
    await this.cacheManager.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  // Поиск группы по ID с кэшированием
  async findById(id: string): Promise<GroupDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Неверный ID группы: ${id}`);
    }

    const cacheKey = `group:${id}`;
    const cachedGroup = await this.cacheManager.get<GroupDocument>(cacheKey);
    if (cachedGroup) {
      this.logger.debug(`Группа найдена в кэше: ${cachedGroup.name}`);
      return cachedGroup;
    }

    const group = await this.groupModel.findById(id).exec();
    if (!group) {
      throw new NotFoundException(`Группа с ID ${id} не найдена`);
    }
    this.logger.debug(`Группа найдена в БД: ${group.name}`);
    await this.cacheManager.set(cacheKey, group, CACHE_TTL);
    return group;
  }

  // Добавление студента в группу с валидацией и кэшированием
  async addStudent(groupId: string, studentId: string): Promise<GroupDocument> {
    if (
      !Types.ObjectId.isValid(groupId) ||
      !Types.ObjectId.isValid(studentId)
    ) {
      throw new BadRequestException('Неверный ID группы или студента');
    }

    // Проверяем существование студента
    const student = await this.usersService.findById(studentId);
    if (!student) {
      throw new NotFoundException(`Студент с ID ${studentId} не найден`);
    }

    // Проверяем, существует ли группа и студент уже в ней
    const group = await this.groupModel.findById(groupId).exec();
    if (!group) {
      throw new NotFoundException(`Группа с ID ${groupId} не найдена`);
    }
    if (group.students.some((id) => id.equals(studentId))) {
      this.logger.warn(
        `Студент ${studentId} уже находится в группе ${groupId}`,
      );
      throw new BadRequestException(`Студент уже состоит в группе ${groupId}`);
    }

    // Добавляем студента
    const updatedGroup = await this.groupModel
      .findByIdAndUpdate(
        groupId,
        { $addToSet: { students: studentId } },
        { new: true },
      )
      .exec();

    if (!updatedGroup) {
      throw new NotFoundException(`Группа с ID ${groupId} не найдена`);
    }

    this.logger.log(`Студент ${studentId} добавлен в группу ${groupId}`);
    await this.cacheManager.del(`group:${groupId}`); // Сбрасываем кэш группы
    await this.cacheManager.del('groups:all'); // Сбрасываем кэш списка групп
    return updatedGroup;
  }

  // Удаление студента из группы с кэшированием
  async removeStudent(
    groupId: string,
    studentId: string,
  ): Promise<GroupDocument> {
    if (
      !Types.ObjectId.isValid(groupId) ||
      !Types.ObjectId.isValid(studentId)
    ) {
      throw new BadRequestException('Неверный ID группы или студента');
    }

    const group = await this.groupModel
      .findByIdAndUpdate(
        groupId,
        { $pull: { students: studentId } },
        { new: true },
      )
      .exec();
    if (!group) {
      throw new NotFoundException(`Группа с ID ${groupId} не найдена`);
    }

    this.logger.log(`Студент ${studentId} удален из группы ${groupId}`);
    await this.cacheManager.del(`group:${groupId}`); // Сбрасываем кэш группы
    await this.cacheManager.del('groups:all'); // Сбрасываем кэш списка групп
    return group;
  }

  // Удаление группы с кэшированием
  async delete(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Неверный ID группы: ${id}`);
    }

    const result = await this.groupModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Группа с ID ${id} не найдена`);
    }

    this.logger.log(`Группа ${id} удалена`);
    await this.cacheManager.del(`group:${id}`); // Сбрасываем кэш группы
    await this.cacheManager.del('groups:all'); // Сбрасываем кэш списка групп
  }
}

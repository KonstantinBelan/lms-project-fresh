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
import { GroupResponseDto } from './dto/group-response.dto';

const CACHE_TTL = parseInt(process.env.CACHE_TTL ?? '3600', 10);

@Injectable()
export class GroupsService implements IGroupsService {
  private readonly logger = new Logger(GroupsService.name);

  constructor(
    @InjectModel(Group.name) private groupModel: Model<GroupDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private usersService: UsersService,
  ) {}

  /**
   * Создает новую группу с кэшированием.
   * @param createGroupDto - Данные для создания группы
   * @returns Созданная группа
   */
  async create(createGroupDto: CreateGroupDto): Promise<GroupDocument> {
    this.logger.log(`Создание группы: ${createGroupDto.name}`);
    const group = new this.groupModel({ ...createGroupDto, students: [] });
    const savedGroup = await group.save();

    // Сбрасываем кэш списка групп
    await this.cacheManager.del('groups:all');
    this.logger.debug(`Группа ${savedGroup._id} создана и кэш сброшен`);
    return savedGroup;
  }

  /**
   * Получает все группы с пагинацией и сортировкой.
   * @param skip - Сколько групп пропустить
   * @param limit - Максимальное количество групп
   * @param sortBy - Поле для сортировки (name или students)
   * @param sortOrder - Порядок сортировки (asc или desc)
   * @returns Объект с массивом групп и общим количеством
   */
  async findAll(
    skip: number = 0,
    limit: number = 10,
    sortBy: 'name' | 'students' = 'name',
    sortOrder: 'asc' | 'desc' = 'asc',
  ): Promise<{ groups: GroupDocument[]; total: number }> {
    const cacheKey = `groups:all:skip:${skip}:limit:${limit}:sortBy:${sortBy}:sortOrder:${sortOrder}`;
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

    const sortCriteria: any = {};
    if (sortBy === 'name') {
      sortCriteria.name = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'students') {
      sortCriteria['students.length'] = sortOrder === 'asc' ? 1 : -1;
    }

    const [groups, total] = await Promise.all([
      this.groupModel.find().sort(sortCriteria).skip(skip).limit(limit).exec(),
      this.groupModel.countDocuments().exec(),
    ]);
    this.logger.debug(
      `Найдено ${groups.length} групп из ${total} в БД с сортировкой по ${sortBy} (${sortOrder})`,
    );
    const result = { groups, total };
    await this.cacheManager.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  /**
   * Находит группу по идентификатору с кэшированием.
   * @param id - Идентификатор группы
   * @returns Найденная группа
   * @throws BadRequestException если ID некорректен
   * @throws NotFoundException если группа не найдена
   */
  async findById(id: string): Promise<GroupDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Неверный идентификатор группы: ${id}`);
    }

    const cacheKey = `group:${id}`;
    const cachedGroup = await this.cacheManager.get<GroupDocument>(cacheKey);
    if (cachedGroup) {
      this.logger.debug(`Группа найдена в кэше: ${cachedGroup.name}`);
      return cachedGroup;
    }

    const group = await this.groupModel.findById(id).exec();
    if (!group) {
      throw new NotFoundException(`Группа с идентификатором ${id} не найдена`);
    }
    this.logger.debug(`Группа найдена в БД: ${group.name}`);
    await this.cacheManager.set(cacheKey, group, CACHE_TTL);
    return group;
  }

  /**
   * Добавляет студента в группу с валидацией и кэшированием.
   * @param groupId - Идентификатор группы
   * @param studentId - Идентификатор студента
   * @returns Обновленная группа
   * @throws BadRequestException если ID некорректен или студент уже в группе
   * @throws NotFoundException если группа или студент не найдены
   */
  async addStudent(groupId: string, studentId: string): Promise<GroupDocument> {
    if (
      !Types.ObjectId.isValid(groupId) ||
      !Types.ObjectId.isValid(studentId)
    ) {
      throw new BadRequestException(
        'Неверный идентификатор группы или студента',
      );
    }

    const student = await this.usersService.findById(studentId);
    if (!student) {
      throw new NotFoundException(
        `Студент с идентификатором ${studentId} не найден`,
      );
    }

    const group = await this.groupModel.findById(groupId).exec();
    if (!group) {
      throw new NotFoundException(
        `Группа с идентификатором ${groupId} не найдена`,
      );
    }
    if (group.students.some((id) => id.toString() === studentId)) {
      this.logger.warn(
        `Студент ${studentId} уже находится в группе ${groupId}`,
      );
      throw new BadRequestException(`Студент уже состоит в группе ${groupId}`);
    }

    const updatedGroup = await this.groupModel
      .findByIdAndUpdate(
        groupId,
        { $addToSet: { students: studentId } },
        { new: true },
      )
      .exec();

    if (!updatedGroup) {
      throw new NotFoundException(
        `Группа с идентификатором ${groupId} не найдена`,
      );
    }

    this.logger.log(`Студент ${studentId} добавлен в группу ${groupId}`);
    await this.cacheManager.del(`group:${groupId}`);
    await this.cacheManager.del('groups:all');
    return updatedGroup;
  }

  /**
   * Удаляет студента из группы с кэшированием.
   * @param groupId - Идентификатор группы
   * @param studentId - Идентификатор студента
   * @returns Обновленная группа
   * @throws BadRequestException если ID некорректен
   * @throws NotFoundException если группа не найдена
   */
  async removeStudent(
    groupId: string,
    studentId: string,
  ): Promise<GroupDocument> {
    if (
      !Types.ObjectId.isValid(groupId) ||
      !Types.ObjectId.isValid(studentId)
    ) {
      throw new BadRequestException(
        'Неверный идентификатор группы или студента',
      );
    }

    const group = await this.groupModel
      .findByIdAndUpdate(
        groupId,
        { $pull: { students: studentId } },
        { new: true },
      )
      .exec();
    if (!group) {
      throw new NotFoundException(
        `Группа с идентификатором ${groupId} не найдена`,
      );
    }

    this.logger.log(`Студент ${studentId} удален из группы ${groupId}`);
    await this.cacheManager.del(`group:${groupId}`);
    await this.cacheManager.del('groups:all');
    return group;
  }

  /**
   * Удаляет группу с кэшированием.
   * @param id - Идентификатор группы
   * @throws BadRequestException если ID некорректен
   * @throws NotFoundException если группа не найдена
   */
  async delete(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Неверный идентификатор группы: ${id}`);
    }

    const result = await this.groupModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Группа с идентификатором ${id} не найдена`);
    }

    this.logger.log(`Группа ${id} удалена`);
    await this.cacheManager.del(`group:${id}`);
    await this.cacheManager.del('groups:all');
  }
}

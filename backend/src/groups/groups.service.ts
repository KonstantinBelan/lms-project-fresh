import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Group, GroupDocument } from './schemas/group.schema';
import { Logger } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';

@Injectable()
export class GroupsService {
  private readonly logger = new Logger(GroupsService.name);

  constructor(@InjectModel('Group') private groupModel: Model<GroupDocument>) {}

  // Создание группы
  async create(createGroupDto: CreateGroupDto): Promise<GroupDocument> {
    this.logger.log(`Создание группы: ${createGroupDto.name}`);
    const group = new this.groupModel({ ...createGroupDto, students: [] });
    return group.save();
  }

  // Получение всех групп с пагинацией
  async findAll(
    skip: number = 0,
    limit: number = 10,
  ): Promise<{ groups: GroupDocument[]; total: number }> {
    this.logger.debug(`Получение групп: skip=${skip}, limit=${limit}`);
    const [groups, total] = await Promise.all([
      this.groupModel.find().skip(skip).limit(limit).exec(),
      this.groupModel.countDocuments().exec(),
    ]);
    this.logger.debug(`Найдено ${groups.length} групп из ${total}`);
    return { groups, total };
  }

  // Поиск группы по ID
  async findById(id: string): Promise<GroupDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Неверный ID группы: ${id}`);
    }
    const group = await this.groupModel.findById(id).exec();
    if (!group) {
      throw new NotFoundException(`Группа с ID ${id} не найдена`);
    }
    this.logger.debug(`Группа найдена: ${group.name}`);
    return group;
  }

  // Добавление студента в группу
  async addStudent(groupId: string, studentId: string): Promise<GroupDocument> {
    if (
      !Types.ObjectId.isValid(groupId) ||
      !Types.ObjectId.isValid(studentId)
    ) {
      throw new BadRequestException('Неверный ID группы или студента');
    }
    const group = await this.groupModel
      .findByIdAndUpdate(
        groupId,
        { $addToSet: { students: studentId } },
        { new: true },
      )
      .exec();
    if (!group) {
      throw new NotFoundException(`Группа с ID ${groupId} не найдена`);
    }
    this.logger.log(`Студент ${studentId} добавлен в группу ${groupId}`);
    return group;
  }

  // Удаление студента из группы
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
    return group;
  }

  // Удаление группы
  async delete(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Неверный ID группы: ${id}`);
    }
    const result = await this.groupModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Группа с ID ${id} не найдена`);
    }
    this.logger.log(`Группа ${id} удалена`);
  }
}

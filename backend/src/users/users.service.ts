import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Role } from '../auth/roles.enum';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly CACHE_TTL = 3600; // Время жизни кэша в секундах (1 час)

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  // Создает нового пользователя
  async create({
    email,
    password,
    roles,
    name,
    phone,
  }: {
    email: string;
    password: string; // Ожидается хэшированный пароль
    roles?: Role[];
    name?: string;
    phone?: string;
  }): Promise<User> {
    this.logger.log(`Создание пользователя с email: ${email}`);
    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      this.logger.warn(`Пользователь с email ${email} уже существует`);
      throw new BadRequestException('Email уже существует');
    }
    const user = new this.userModel({
      email,
      password,
      roles: roles || [Role.STUDENT],
      name,
      phone,
    });
    const savedUser = await user.save();
    await this.cacheManager.del('users:all');
    return savedUser.toObject();
  }

  // Находит пользователя по ID
  async findById(id: string): Promise<User | null> {
    if (!Types.ObjectId.isValid(id)) {
      this.logger.warn(`Некорректный ID: ${id}`);
      throw new BadRequestException('Некорректный ID');
    }
    this.logger.debug(`Поиск пользователя по ID: ${id}`);
    const cacheKey = `user:${id}`;
    const cachedUser = await this.cacheManager.get<User>(cacheKey);
    if (cachedUser) {
      this.logger.debug(`Пользователь найден в кэше: ${id}`);
      return cachedUser;
    }

    const user = await this.userModel.findById(id).lean().exec();
    if (user) {
      await this.cacheManager.set(cacheKey, user, this.CACHE_TTL);
      this.logger.debug(`Пользователь найден в базе: ${id}`);
    } else {
      this.logger.warn(`Пользователь с ID ${id} не найден`);
    }
    return user;
  }

  // Находит пользователя по email
  async findByEmail(email: string): Promise<User | null> {
    this.logger.debug(`Поиск пользователя по email: ${email}`);
    const cacheKey = `user:email:${email}`;
    const cachedUser = await this.cacheManager.get<User>(cacheKey);
    if (cachedUser) {
      this.logger.debug(`Пользователь найден в кэше: ${email}`);
      return cachedUser;
    }

    const user = await this.userModel
      .findOne({ email })
      .select('+password')
      .lean()
      .exec();
    if (user) {
      await this.cacheManager.set(cacheKey, user, this.CACHE_TTL);
      this.logger.debug(`Пользователь найден в базе: ${email}`);
    } else {
      this.logger.warn(`Пользователь с email ${email} не найден`);
    }
    return user;
  }

  // Находит пользователей по списку ID
  async findManyByIds(ids: string[]): Promise<User[]> {
    const objectIds = ids.map((id) => {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException(`Некорректный ID: ${id}`);
      }
      return new Types.ObjectId(id);
    });
    this.logger.debug(`Поиск пользователей по IDs: ${ids}`);
    return this.userModel
      .find({ _id: { $in: objectIds } })
      .lean()
      .exec();
  }

  // Получает всех пользователей с фильтрами и пагинацией
  async findAll(
    filters: { roles?: string[]; email?: string; groups?: string[] } = {},
    page: number = 1,
    limit: number = 10,
  ): Promise<{ users: User[]; total: number }> {
    this.logger.debug('Получение пользователей с фильтрами и пагинацией');
    const cacheKey = `users:all:${JSON.stringify({ filters, page, limit })}`;
    const cachedResult = await this.cacheManager.get<{
      users: User[];
      total: number;
    }>(cacheKey);
    if (cachedResult) {
      this.logger.debug('Пользователи найдены в кэше');
      return cachedResult;
    }

    const query: any = {};
    if (filters.roles?.length) {
      query.roles = { $in: filters.roles };
    }
    if (filters.email) {
      query.email = { $regex: filters.email, $options: 'i' };
    }
    if (filters.groups?.length) {
      const groupObjectIds = filters.groups.map((id) => {
        if (!Types.ObjectId.isValid(id)) {
          throw new BadRequestException(`Некорректный ID группы: ${id}`);
        }
        return new Types.ObjectId(id);
      });
      query.groups = { $in: groupObjectIds };
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.userModel.find(query).skip(skip).limit(limit).lean().exec(),
      this.userModel.countDocuments(query).exec(),
    ]);

    const result = { users, total };
    await this.cacheManager.set(cacheKey, result, this.CACHE_TTL);
    this.logger.debug(
      `Найдено ${users.length} пользователей из ${total} в базе`,
    );
    return result;
  }

  // Обновляет данные пользователя
  async updateUser(
    id: string,
    updateData: {
      password?: string;
      name?: string;
      phone?: string;
      roles?: Role[];
      telegramId?: string;
      settings?: {
        notifications: boolean;
        language: string;
        resetToken?: string;
        resetTokenExpires?: number;
      };
      groups?: { $addToSet?: string; $pull?: string };
    },
  ): Promise<User | null> {
    console.log('updateData in service:', updateData); // Для отладки
    if (!Types.ObjectId.isValid(id)) {
      this.logger.warn(`Некорректный ID: ${id}`);
      throw new BadRequestException('Некорректный ID');
    }

    // Проверяем, есть ли данные для обновления
    const hasData = Object.values(updateData).some(
      (value) => value !== undefined,
    );
    if (!hasData) {
      this.logger.warn(`Пустые данные для обновления пользователя с ID: ${id}`);
      throw new BadRequestException('Нет данных для обновления');
    }

    this.logger.log(`Обновление пользователя с ID: ${id}`);

    const update: { $set?: any; $addToSet?: any; $pull?: any } = {};
    const simpleFields = { ...updateData };
    delete simpleFields.groups;
    if (Object.keys(simpleFields).length > 0) {
      update.$set = simpleFields;
    }
    if (updateData.groups) {
      if (updateData.groups.$addToSet) {
        if (!Types.ObjectId.isValid(updateData.groups.$addToSet)) {
          throw new BadRequestException(
            `Некорректный groupId: ${updateData.groups.$addToSet}`,
          );
        }
        update.$addToSet = { groups: updateData.groups.$addToSet };
      }
      if (updateData.groups.$pull) {
        if (!Types.ObjectId.isValid(updateData.groups.$pull)) {
          throw new BadRequestException(
            `Некорректный groupId: ${updateData.groups.$pull}`,
          );
        }
        update.$pull = { groups: updateData.groups.$pull };
      }
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, update, { new: true })
      .lean()
      .exec();
    if (!updatedUser) {
      this.logger.warn(`Пользователь с ID ${id} не найден для обновления`);
      throw new NotFoundException(`Пользователь с ID ${id} не найден`);
    }

    await Promise.all([
      this.cacheManager.del(`user:${id}`),
      this.cacheManager.del(`user:email:${updatedUser.email}`),
      this.cacheManager.del('users:all'),
    ]);
    this.logger.debug(`Пользователь с ID ${id} обновлен`);
    return updatedUser;
  }

  // Удаляет пользователя
  async deleteUser(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      this.logger.warn(`Некорректный ID: ${id}`);
      throw new BadRequestException('Некорректный ID');
    }
    this.logger.log(`Удаление пользователя с ID: ${id}`);
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Пользователь с ID ${id} не найден`);
    }
    await Promise.all([
      this.cacheManager.del(`user:${id}`),
      this.cacheManager.del(`user:email:${result.email}`),
      this.cacheManager.del('users:all'),
    ]);
  }
}

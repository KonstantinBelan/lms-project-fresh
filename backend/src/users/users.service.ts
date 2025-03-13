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

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create({
    email,
    password,
    roles,
    name,
    phone,
  }: {
    email: string;
    password: string; // Предполагается, что пароль уже хэширован
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
    await this.cacheManager.del('users:all'); // Очистка кэша списка пользователей
    return savedUser.toObject();
  }

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
      await this.cacheManager.set(cacheKey, user, 3600);
      this.logger.debug(`Пользователь найден в базе: ${id}`);
    } else {
      this.logger.warn(`Пользователь с ID ${id} не найден`);
    }
    return user;
  }

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
      await this.cacheManager.set(cacheKey, user, 3600);
      this.logger.debug(`Пользователь найден в базе: ${email}`);
    } else {
      this.logger.warn(`Пользователь с email ${email} не найден`);
    }
    return user;
  }

  async findManyByIds(ids: string[]): Promise<User[]> {
    const objectIds = ids.map((id) => {
      if (!Types.ObjectId.isValid(id))
        throw new BadRequestException(`Некорректный ID: ${id}`);
      return new Types.ObjectId(id);
    });
    this.logger.debug(`Поиск пользователей по IDs: ${ids}`);
    return this.userModel
      .find({ _id: { $in: objectIds } })
      .lean()
      .exec();
  }

  async findAll(): Promise<User[]> {
    this.logger.debug('Получение всех пользователей');
    const cacheKey = 'users:all';
    const cachedUsers = await this.cacheManager.get<User[]>(cacheKey);
    if (cachedUsers) {
      this.logger.debug('Пользователи найдены в кэше');
      return cachedUsers;
    }

    const users = await this.userModel.find().lean().exec();
    await this.cacheManager.set(cacheKey, users, 3600);
    this.logger.debug(`Найдено ${users.length} пользователей в базе`);
    return users;
  }

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
    if (!Types.ObjectId.isValid(id)) {
      this.logger.warn(`Некорректный ID: ${id}`);
      throw new BadRequestException('Некорректный ID');
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

    await this.cacheManager.del(`user:${id}`);
    await this.cacheManager.del(`user:email:${updatedUser.email}`);
    await this.cacheManager.del('users:all');
    this.logger.debug(`Пользователь с ID ${id} обновлен`);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      this.logger.warn(`Некорректный ID: ${id}`);
      throw new BadRequestException('Некорректный ID');
    }
    this.logger.log(`Удаление пользователя с ID: ${id}`);
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result)
      throw new NotFoundException(`Пользователь с ID ${id} не найден`);
    await this.cacheManager.del(`user:${id}`);
    await this.cacheManager.del(`user:email:${result.email}`);
    await this.cacheManager.del('users:all');
  }
}

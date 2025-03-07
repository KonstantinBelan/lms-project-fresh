import {
  Inject,
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { Role } from '../auth/roles.enum';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Types } from 'mongoose';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  // async create({
  //   email,
  //   password,
  //   roles,
  //   name,
  //   phone,
  // }: {
  //   email: string;
  //   password: string; // Принимаем уже хэшированный пароль
  //   roles?: Role[];
  //   name?: string;
  //   phone?: string;
  // }): Promise<User> {
  //   console.log('Creating user with pre-hashed password:', { email, password });
  //   const newUser = new this.userModel({
  //     email,
  //     password, // Сохраняем пароль как есть
  //     roles: roles || [Role.STUDENT],
  //     name,
  //   });
  //   const savedUser = await newUser.save();
  //   return savedUser.toObject();
  // }

  async create({
    email,
    password,
    roles,
    name,
    phone,
  }: {
    email: string;
    password: string; // Принимаем уже хэшированный пароль
    roles?: Role[];
    name?: string;
    phone?: string;
  }): Promise<User> {
    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new this.userModel({ email, password: hashedPassword, roles });
    return user.save();
  }

  async findById(id: string): Promise<User | null> {
    console.log('Finding user by ID:', { id });
    const cacheKey = `user:${id}`;
    const cachedUser = await this.cacheManager.get<User>(cacheKey);
    if (cachedUser) {
      console.log('User found in cache:', cachedUser);
      return cachedUser;
    }

    const objectId = new Types.ObjectId(id);
    const user = await this.userModel.findById(objectId).lean().exec();
    console.log('User found in DB:', user);
    if (user) await this.cacheManager.set(cacheKey, user, 3600);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    console.log('Finding user by email:', { email });
    const cacheKey = `user:email:${email}`;
    const cachedUser = await this.cacheManager.get<User>(cacheKey);
    if (cachedUser) {
      console.log('User found in cache:', cachedUser);
      return cachedUser;
    }

    const user = await this.userModel
      .findOne({ email })
      .select('+password')
      .lean()
      .exec();
    console.log('User found in DB:', user);
    if (user) await this.cacheManager.set(cacheKey, user, 3600);
    return user;
  }

  async findAll(): Promise<User[]> {
    const cacheKey = 'users:all';
    const cachedUsers = await this.cacheManager.get<User[]>(cacheKey);
    if (cachedUsers) {
      console.log('Users found in cache:', cachedUsers);
      return cachedUsers;
    }

    const users = await this.userModel.find().lean().exec();
    console.log('Users found in DB:', users);
    await this.cacheManager.set(cacheKey, users, 3600);
    return users;
  }

  // async updateUser(
  //   id: string,
  //   updateData: {
  //     password?: string;
  //     name?: string;
  //     phone?: string;
  //     roles?: Role[];
  //     telegramId?: string;
  //     settings?: {
  //       notifications: boolean;
  //       language: string;
  //       resetToken?: string;
  //     };
  //     groups?: { $addToSet?: string; $pull?: string };
  //   },
  // ): Promise<User | null> {
  //   // Изменяем тип возврата на User для .lean()
  //   const update: any = {};
  //   if (updateData.password) update.password = updateData.password;
  //   if (updateData.name) update.name = updateData.name;
  //   if (updateData.phone) update.phone = updateData.phone;
  //   if (updateData.roles) update.roles = updateData.roles;
  //   if (updateData.settings) update.settings = updateData.settings;
  //   if (updateData.groups) {
  //     if (updateData.groups.$addToSet)
  //       update.$addToSet = { groups: updateData.groups.$addToSet };
  //     if (updateData.groups.$pull)
  //       update.$pull = { groups: updateData.groups.$pull };
  //   }
  //   return this.userModel
  //     .findByIdAndUpdate(id, update, { new: true })
  //     .lean()
  //     .exec(); // Используем .lean()
  // }

  async updateUser(
    id: string,
    updateData: {
      password?: string;
      name?: string;
      phone?: string;
      roles?: Role[];
      telegramId?: string; // Уже есть в типе, теперь добавим в логику
      settings?: {
        notifications: boolean;
        language: string;
        resetToken?: string;
      };
      groups?: { $addToSet?: string; $pull?: string };
    },
  ): Promise<User | null> {
    // Формируем объект обновления
    const update: { $set?: any; $addToSet?: any; $pull?: any } = {};

    // Простые поля для $set
    const simpleFields = { ...updateData };
    delete simpleFields.groups; // Убираем groups, так как он обрабатывается отдельно
    if (Object.keys(simpleFields).length > 0) {
      update.$set = simpleFields; // Включаем все поля, включая telegramId
    }

    // Обработка groups с операторами $addToSet и $pull
    if (updateData.groups) {
      if (updateData.groups.$addToSet) {
        update.$addToSet = { groups: updateData.groups.$addToSet };
      }
      if (updateData.groups.$pull) {
        update.$pull = { groups: updateData.groups.$pull };
      }
    }

    // Выполняем обновление
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, update, { new: true })
      .lean()
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    await this.userModel.findByIdAndDelete(id).exec();
    await this.cacheManager.del(`user:${id}`);
    await this.cacheManager.del('users:all');
  }
}

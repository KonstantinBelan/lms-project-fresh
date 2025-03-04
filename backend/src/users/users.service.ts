import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { IUsersService } from './users.service.interface';
import { Role } from '../auth/roles.enum'; // Импортируем Role
import { CACHE_MANAGER } from '@nestjs/cache-manager'; // Импортируем CACHE_MANAGER
import { Cache } from 'cache-manager'; // Импортируем Cache
import { Types } from 'mongoose';

@Injectable()
export class UsersService implements IUsersService {
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
    password: string;
    roles?: Role[];
    name?: string;
    phone?: string;
  }): Promise<User> {
    console.log('Hashing password:', { email, saltRounds: 10 });
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Hashed password:', hashedPassword);
    const newUser = new this.userModel({
      email,
      password: hashedPassword,
      roles: roles || [Role.STUDENT],
      name,
    });
    return newUser.save();
  }

  async findById(id: string): Promise<User | null> {
    console.log('Finding user by ID:', { id });

    const cacheKey = `user:${id}`;
    const cachedUser = await this.cacheManager.get<User>(cacheKey);
    if (cachedUser) {
      console.log('User found in cache:', cachedUser);
      return cachedUser;
    }

    const objectId = new Types.ObjectId(id); // Явно создаём ObjectId из строки
    const user = await this.userModel.findById(objectId).lean().exec();
    console.log('User found in DB:', user);
    if (user) await this.cacheManager.set(cacheKey, user, 3600); // Кэшируем на 1 час
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
    if (user) await this.cacheManager.set(cacheKey, user, 3600); // Кэшируем на 1 час
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
    await this.cacheManager.set(cacheKey, users, 3600); // Кэшируем на 1 час
    return users;
  }
}

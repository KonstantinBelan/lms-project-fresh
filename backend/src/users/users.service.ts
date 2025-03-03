import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { IUsersService } from './users.service.interface';
import { Role } from '../auth/roles.enum'; // Импортируем Role

@Injectable()
export class UsersService implements IUsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create({
    email,
    password,
    roles,
    name,
  }: {
    email: string;
    password: string;
    roles?: Role[];
    name?: string;
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
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<User | null> {
    console.log('Finding user by email:', { email });
    const user = await this.userModel
      .findOne({ email })
      .select('+password')
      .lean() // Добавляем метод lean перед exec()
      .exec();
    console.log('User found in DB:', user);
    return user;
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }
}

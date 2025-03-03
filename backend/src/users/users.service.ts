import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { IUsersService } from './users.service.interface';
import * as bcrypt from 'bcrypt';
import { Role } from '../auth/roles.enum';

@Injectable()
export class UsersService implements IUsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create({
    email,
    password,
    roles,
  }: {
    email: string;
    password: string;
    roles?: Role[];
  }): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new this.userModel({
      email,
      password: hashedPassword,
      roles: roles || [Role.STUDENT],
    });
    return newUser.save();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }
}

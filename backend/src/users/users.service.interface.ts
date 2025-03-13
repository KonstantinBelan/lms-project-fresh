import { User } from './schemas/user.schema';
import { Role } from '../auth/roles.enum';

export interface IUsersService {
  create({
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
  }): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  updateUser(
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
  ): Promise<User | null>;
  deleteUser(id: string): Promise<void>;
}

import { User } from './schemas/user.schema';

export interface IUsersService {
  create(
    email: string,
    password: string,
    name: string,
    role?: 'admin' | 'teacher' | 'student',
  ): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findAll(): Promise<User[]>;
}

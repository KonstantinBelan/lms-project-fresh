import { User } from './schemas/user.schema';
import { Role } from '../auth/roles.enum';

export interface IUsersService {
  create({
    email,
    password,
    roles,
    name,
  }: {
    email: string;
    password: string;
    roles?: Role[];
    name?: string;
  }): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findAll(): Promise<User[]>;
}

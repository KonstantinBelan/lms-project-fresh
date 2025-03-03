import { User } from './schemas/user.schema';
import { Role } from '../auth/roles.enum';

export interface IUsersService {
  create({
    email,
    password,
    roles,
  }: {
    email: string;
    password: string;
    roles?: Role[];
  }): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findAll(): Promise<User[]>;
}

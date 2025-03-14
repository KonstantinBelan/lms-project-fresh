import { User } from './schemas/user.schema';
import { Role } from '../auth/roles.enum';

export interface IUsersService {
  /**
   * Создаёт нового пользователя.
   */
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

  /**
   * Находит пользователя по email.
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Находит пользователя по ID.
   */
  findById(id: string): Promise<User | null>;

  /**
   * Получает всех пользователей с опциональными фильтрами.
   */
  findAll(filters?: {
    roles?: string[];
    email?: string;
    groups?: string[];
  }): Promise<User[]>;

  /**
   * Обновляет данные пользователя.
   */
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

  /**
   * Удаляет пользователя.
   */
  deleteUser(id: string): Promise<void>;
}

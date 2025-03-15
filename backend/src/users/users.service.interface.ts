import { User } from './schemas/user.schema';
import { Role } from '../auth/roles.enum';

// Интерфейс для сервиса пользователей
export interface IUsersService {
  // Создает нового пользователя
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

  // Находит пользователя по email
  findByEmail(email: string): Promise<User | null>;

  // Находит пользователя по ID
  findById(id: string): Promise<User | null>;

  // Получает всех пользователей с фильтрами и пагинацией
  findAll(
    filters?: { roles?: string[]; email?: string; groups?: string[] },
    page?: number,
    limit?: number,
  ): Promise<{ users: User[]; total: number }>;

  // Обновляет данные пользователя
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

  // Удаляет пользователя
  deleteUser(id: string): Promise<void>;
}

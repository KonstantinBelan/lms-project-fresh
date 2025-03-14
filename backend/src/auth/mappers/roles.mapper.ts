import { Role } from '../roles.enum';

// Маппинг ролей на человекочитаемые названия на русском языке
export const RoleDescriptions: Record<Role, string> = {
  [Role.STUDENT]: 'Студент',
  [Role.TEACHER]: 'Преподаватель',
  [Role.ADMIN]: 'Администратор',
  [Role.MANAGER]: 'Менеджер курсов',
  [Role.ASSISTANT]: 'Помощник преподавателя',
};

// Функция для получения человекочитаемого названия роли
export const getRoleDescription = (role: Role): string => {
  return RoleDescriptions[role] || 'Неизвестная роль';
};

// Функция для получения всех ролей с их описаниями
export const getAllRolesWithDescriptions = (): {
  role: Role;
  description: string;
}[] => {
  return Object.keys(RoleDescriptions).map((key) => ({
    role: key as Role,
    description: RoleDescriptions[key as Role],
  }));
};

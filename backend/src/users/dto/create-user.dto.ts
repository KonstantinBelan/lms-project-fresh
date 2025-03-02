export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  role?: string; // Опциональное, по умолчанию 'student'
}

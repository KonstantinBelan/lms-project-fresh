import { Types } from 'mongoose';
import { User } from '../schemas/user.schema';
import { UserResponseDto } from '../dto/user-response.dto';

// Преобразует объект User в UserResponseDto
export function mapToUserResponseDto(user: User): UserResponseDto {
  const userObj = user as any;
  return {
    _id:
      userObj._id instanceof Types.ObjectId
        ? userObj._id.toString()
        : String(userObj._id),
    email: userObj.email,
    name: userObj.name,
    roles: userObj.roles,
    phone: userObj.phone,
    avatar: userObj.avatar,
    telegramId: userObj.telegramId,
    settings: userObj.settings ? { ...userObj.settings } : undefined,
    groups: (userObj.groups || []).map((id: any) =>
      id instanceof Types.ObjectId ? id.toString() : String(id),
    ),
  };
}

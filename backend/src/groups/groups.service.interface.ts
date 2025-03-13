import { Group, GroupDocument } from './schemas/group.schema';
import { CreateGroupDto } from './dto/create-group.dto';

export interface IGroupsService {
  create(createGroupDto: CreateGroupDto): Promise<GroupDocument>;
  findAll(
    skip?: number,
    limit?: number,
    sortBy?: 'name' | 'students',
    sortOrder?: 'asc' | 'desc',
  ): Promise<{ groups: GroupDocument[]; total: number }>;
  findById(id: string): Promise<GroupDocument>;
  addStudent(groupId: string, studentId: string): Promise<GroupDocument>;
  removeStudent(groupId: string, studentId: string): Promise<GroupDocument>;
  delete(id: string): Promise<void>;
}

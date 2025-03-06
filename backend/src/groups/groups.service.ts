// backend/src/groups/groups.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Group, GroupDocument } from './schemas/group.schema';

@Injectable()
export class GroupsService {
  constructor(@InjectModel('Group') private groupModel: Model<GroupDocument>) {}

  async create(name: string, description?: string): Promise<GroupDocument> {
    const group = new this.groupModel({ name, description, students: [] });
    return group.save();
  }

  async findAll(): Promise<GroupDocument[]> {
    return this.groupModel.find().exec();
  }

  async findById(id: string): Promise<GroupDocument | null> {
    return this.groupModel.findById(id).exec();
  }

  async addStudent(
    groupId: string,
    studentId: string,
  ): Promise<GroupDocument | null> {
    return this.groupModel
      .findByIdAndUpdate(
        groupId,
        { $addToSet: { students: studentId } },
        { new: true },
      )
      .exec();
  }

  async removeStudent(
    groupId: string,
    studentId: string,
  ): Promise<GroupDocument | null> {
    return this.groupModel
      .findByIdAndUpdate(
        groupId,
        { $pull: { students: studentId } },
        { new: true },
      )
      .exec();
  }

  async delete(id: string): Promise<void> {
    await this.groupModel.findByIdAndDelete(id).exec();
  }
}

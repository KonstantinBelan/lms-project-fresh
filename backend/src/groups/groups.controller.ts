import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  SetMetadata,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GroupsService } from './groups.service';
import { Role } from '../auth/roles.enum';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('groups')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class GroupsController {
  constructor(private groupsService: GroupsService) {}

  @Post()
  @SetMetadata('roles', [Role.ADMIN])
  async create(@Body() body: { name: string; description?: string }) {
    return this.groupsService.create(body.name, body.description);
  }

  @Get()
  @SetMetadata('roles', [Role.ADMIN, Role.TEACHER])
  async findAll() {
    return this.groupsService.findAll();
  }

  @Get(':id')
  @SetMetadata('roles', [Role.ADMIN, Role.TEACHER])
  async findById(@Param('id') id: string) {
    return this.groupsService.findById(id);
  }

  @Post(':id/students/:studentId')
  @SetMetadata('roles', [Role.ADMIN])
  async addStudent(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ) {
    return this.groupsService.addStudent(id, studentId);
  }

  @Delete(':id/students/:studentId')
  @SetMetadata('roles', [Role.ADMIN])
  async removeStudent(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ) {
    return this.groupsService.removeStudent(id, studentId);
  }

  @Delete(':id')
  @SetMetadata('roles', [Role.ADMIN])
  async delete(@Param('id') id: string) {
    return this.groupsService.delete(id);
  }
}

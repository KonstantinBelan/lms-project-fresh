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
import { CreateGroupDto } from './dto/create-group.dto';
import { ApiTags, ApiParam, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Groups')
@Controller('groups')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class GroupsController {
  constructor(private groupsService: GroupsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new group' })
  @ApiResponse({
    status: 201,
    description: 'Group created',
    type: CreateGroupDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @SetMetadata('roles', [Role.ADMIN])
  async create(@Body() body: { name: string; description?: string }) {
    return this.groupsService.create(body.name, body.description);
  }

  @Get()
  @ApiOperation({ summary: 'Get all groups' })
  @ApiResponse({
    status: 200,
    description: 'Groups retrieved successfully',
    type: [CreateGroupDto],
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @SetMetadata('roles', [Role.ADMIN, Role.TEACHER])
  async findAll() {
    return this.groupsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get group by ID' })
  @ApiParam({
    name: 'id',
    description: 'Group ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Group found',
    type: CreateGroupDto,
  })
  @ApiResponse({ status: 404, description: 'Group not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @SetMetadata('roles', [Role.ADMIN, Role.TEACHER])
  async findById(@Param('id') id: string) {
    return this.groupsService.findById(id);
  }

  @Post(':id/students/:studentId')
  @ApiOperation({ summary: 'Add student to group' })
  @ApiParam({ name: 'id', description: 'Group ID', example: '123' })
  @ApiParam({ name: 'studentId', description: 'Student ID', example: '456' })
  @ApiResponse({ status: 201, description: 'Student added to group' })
  @ApiResponse({ status: 404, description: 'Group or student not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @SetMetadata('roles', [Role.ADMIN])
  async addStudent(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ) {
    return this.groupsService.addStudent(id, studentId);
  }

  @Delete(':id/students/:studentId')
  @ApiOperation({ summary: 'Remove student from group' })
  @ApiParam({ name: 'id', description: 'Group ID', example: '123' })
  @ApiParam({ name: 'studentId', description: 'Student ID', example: '456' })
  @ApiResponse({
    status: 200,
    description: 'Student removed from group',
    schema: {
      example: { message: 'Student removed from group' },
    },
  })
  @ApiResponse({ status: 404, description: 'Group or student not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @SetMetadata('roles', [Role.ADMIN])
  async removeStudent(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ) {
    return this.groupsService.removeStudent(id, studentId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete group' })
  @ApiParam({
    name: 'id',
    description: 'Group ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Group deleted',
    schema: {
      example: { message: 'Group deleted' },
    },
  })
  @ApiResponse({ status: 404, description: 'Group not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @SetMetadata('roles', [Role.ADMIN])
  async delete(@Param('id') id: string) {
    return this.groupsService.delete(id);
  }
}

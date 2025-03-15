import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GroupsService } from './groups.service';
import { Role } from '../auth/roles.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupResponseDto } from './dto/group-response.dto';
import {
  ApiSecurity,
  ApiTags,
  ApiParam,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { ParseIntPipe, DefaultValuePipe } from '@nestjs/common';

@ApiTags('Группы')
@Controller('groups')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class GroupsController {
  private readonly logger = new Logger(GroupsController.name);

  constructor(private groupsService: GroupsService) {}

  @Post()
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Создать новую группу' })
  @ApiResponse({
    status: 201,
    description: 'Группа создана',
    type: GroupResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Неверный запрос',
    schema: { example: { message: 'Название должно быть строкой' } },
  })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  @Roles(Role.ADMIN)
  async create(
    @Body() createGroupDto: CreateGroupDto,
  ): Promise<GroupResponseDto> {
    this.logger.log(`Создание группы: ${createGroupDto.name}`);
    const group = await this.groupsService.create(createGroupDto);
    return this.mapToResponseDto(group);
  }

  @Get()
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Получить все группы' })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    description: 'Сколько групп пропустить',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Максимальное количество групп',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['name', 'students'],
    description: 'Сортировать по имени или количеству студентов',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Порядок сортировки',
  })
  @ApiResponse({
    status: 200,
    description: 'Группы успешно получены',
    schema: {
      type: 'object',
      properties: {
        groups: {
          type: 'array',
          items: { $ref: '#/components/schemas/GroupResponseDto' },
        },
        total: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  @Roles(Role.ADMIN, Role.TEACHER)
  async findAll(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('sortBy') sortBy: 'name' | 'students' = 'name',
    @Query('sortOrder') sortOrder: 'asc' | 'desc' = 'asc',
  ): Promise<{ groups: GroupResponseDto[]; total: number }> {
    this.logger.log(
      `Получение всех групп: skip=${skip}, limit=${limit}, sortBy=${sortBy}, sortOrder=${sortOrder}`,
    );
    const result = await this.groupsService.findAll(
      skip,
      limit,
      sortBy,
      sortOrder,
    );
    return {
      groups: result.groups.map(this.mapToResponseDto),
      total: result.total,
    };
  }

  @Get(':id')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Получить группу по идентификатору' })
  @ApiParam({
    name: 'id',
    description: 'Идентификатор группы',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Группа найдена',
    type: GroupResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Группа не найдена',
    schema: {
      example: {
        message: 'Группа с идентификатором 507f1f77bcf86cd799439011 не найдена',
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  @Roles(Role.ADMIN, Role.TEACHER)
  async findById(@Param('id') id: string): Promise<GroupResponseDto> {
    this.logger.log(`Поиск группы по идентификатору: ${id}`);
    const group = await this.groupsService.findById(id);
    return this.mapToResponseDto(group);
  }

  @Post(':id/students/:studentId')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Добавить студента в группу' })
  @ApiParam({
    name: 'id',
    description: 'Идентификатор группы',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'studentId',
    description: 'Идентификатор студента',
    example: '507f191e810c19729de860ea',
  })
  @ApiResponse({
    status: 201,
    description: 'Студент добавлен в группу',
    type: GroupResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Группа или студент не найдены',
    schema: {
      example: {
        message: 'Студент с идентификатором 507f191e810c19729de860ea не найден',
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  @Roles(Role.ADMIN)
  async addStudent(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ): Promise<GroupResponseDto> {
    this.logger.log(`Добавление студента ${studentId} в группу ${id}`);
    const group = await this.groupsService.addStudent(id, studentId);
    return this.mapToResponseDto(group);
  }

  @Delete(':id/students/:studentId')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Удалить студента из группы' })
  @ApiParam({
    name: 'id',
    description: 'Идентификатор группы',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'studentId',
    description: 'Идентификатор студента',
    example: '507f191e810c19729de860ea',
  })
  @ApiResponse({
    status: 200,
    description: 'Студент удален из группы',
    type: GroupResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Группа не найдена',
    schema: {
      example: {
        message: 'Группа с идентификатором 507f1f77bcf86cd799439011 не найдена',
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  @Roles(Role.ADMIN)
  async removeStudent(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ): Promise<GroupResponseDto> {
    this.logger.log(`Удаление студента ${studentId} из группы ${id}`);
    const group = await this.groupsService.removeStudent(id, studentId);
    return this.mapToResponseDto(group);
  }

  @Delete(':id')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Удалить группу' })
  @ApiParam({
    name: 'id',
    description: 'Идентификатор группы',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Группа удалена',
    schema: { example: { message: 'Группа удалена' } },
  })
  @ApiResponse({
    status: 404,
    description: 'Группа не найдена',
    schema: {
      example: {
        message: 'Группа с идентификатором 507f1f77bcf86cd799439011 не найдена',
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  @Roles(Role.ADMIN)
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    this.logger.log(`Удаление группы ${id}`);
    await this.groupsService.delete(id);
    return { message: 'Группа удалена' };
  }

  /**
   * Преобразует группу в DTO ответа.
   * @param group - Объект группы
   * @returns GroupResponseDto
   */
  private mapToResponseDto(group: GroupDocument): GroupResponseDto {
    return {
      _id: group._id.toString(),
      name: group.name,
      description: group.description,
      students: group.students.map((id) => id.toString()),
    };
  }
}

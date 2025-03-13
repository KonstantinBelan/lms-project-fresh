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
    type: CreateGroupDto,
  })
  @ApiResponse({ status: 400, description: 'Неверный запрос' })
  @Roles(Role.ADMIN)
  async create(@Body() createGroupDto: CreateGroupDto) {
    this.logger.log(`Создание группы: ${createGroupDto.name}`);
    return this.groupsService.create(createGroupDto);
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
  @ApiResponse({
    status: 200,
    description: 'Группы успешно получены',
    schema: {
      type: 'object',
      properties: {
        groups: {
          type: 'array',
          items: { $ref: '#/components/schemas/Group' },
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
  ) {
    this.logger.log(`Получение всех групп: skip=${skip}, limit=${limit}`);
    return this.groupsService.findAll(skip, limit);
  }

  @Get(':id')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Получить группу по ID' })
  @ApiParam({
    name: 'id',
    description: 'ID группы',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Группа найдена',
    type: CreateGroupDto,
  })
  @ApiResponse({ status: 404, description: 'Группа не найдена' })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  @Roles(Role.ADMIN, Role.TEACHER)
  async findById(@Param('id') id: string) {
    this.logger.log(`Поиск группы по ID: ${id}`);
    return this.groupsService.findById(id);
  }

  @Post(':id/students/:studentId')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Добавить студента в группу' })
  @ApiParam({
    name: 'id',
    description: 'ID группы',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'studentId',
    description: 'ID студента',
    example: '507f191e810c19729de860ea',
  })
  @ApiResponse({ status: 201, description: 'Студент добавлен в группу' })
  @ApiResponse({ status: 404, description: 'Группа или студент не найдены' })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  @Roles(Role.ADMIN)
  async addStudent(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ) {
    this.logger.log(`Добавление студента ${studentId} в группу ${id}`);
    return this.groupsService.addStudent(id, studentId);
  }

  @Delete(':id/students/:studentId')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Удалить студента из группы' })
  @ApiParam({
    name: 'id',
    description: 'ID группы',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'studentId',
    description: 'ID студента',
    example: '507f191e810c19729de860ea',
  })
  @ApiResponse({
    status: 200,
    description: 'Студент удален из группы',
    schema: { example: { message: 'Студент удален из группы' } },
  })
  @ApiResponse({ status: 404, description: 'Группа или студент не найдены' })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  @Roles(Role.ADMIN)
  async removeStudent(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ) {
    this.logger.log(`Удаление студента ${studentId} из группы ${id}`);
    await this.groupsService.removeStudent(id, studentId);
    return { message: 'Студент удален из группы' };
  }

  @Delete(':id')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Удалить группу' })
  @ApiParam({
    name: 'id',
    description: 'ID группы',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Группа удалена',
    schema: { example: { message: 'Группа удалена' } },
  })
  @ApiResponse({ status: 404, description: 'Группа не найдена' })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  @Roles(Role.ADMIN)
  async delete(@Param('id') id: string) {
    this.logger.log(`Удаление группы ${id}`);
    await this.groupsService.delete(id);
    return { message: 'Группа удалена' };
  }
}

import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Req,
  Put,
  Delete,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { BatchCourseDto } from './dto/batch-course.dto';
import { LeaderboardEntry } from './dto/leaderboard-entry.dto';
import { JwtRequest } from '../common/interfaces/jwt-request.interface';
import { Role } from '../auth/roles.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Course } from './schemas/course.schema';

// Контроллер курсов
@ApiTags('Курсы')
@Controller('courses')
@ApiBearerAuth('JWT-auth')
export class CoursesController {
  private readonly logger = new Logger(CoursesController.name);

  constructor(private readonly coursesService: CoursesService) {}

  // Создание нового курса
  @Post()
  @ApiOperation({ summary: 'Создать новый курс' })
  @ApiResponse({ status: 201, description: 'Курс создан', type: Course })
  @ApiResponse({ status: 400, description: 'Неверный запрос' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER, Role.MANAGER)
  @UsePipes(new ValidationPipe())
  async create(@Body() createCourseDto: CreateCourseDto): Promise<Course> {
    this.logger.log(`Создание курса: ${createCourseDto.title}`);
    return this.coursesService.createCourse(createCourseDto);
  }
}

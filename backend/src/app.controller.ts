import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Get API status',
    description:
      'Returns a simple status message to check if the API is running.',
  })
  @ApiResponse({
    status: 200,
    description: 'API is running',
    type: String,
    example: 'LMS API is running!',
  })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test')
  @Get('test')
  @ApiOperation({ summary: 'Test endpoint' })
  @ApiResponse({ status: 200, description: 'Test successful', type: String })
  getTest(): string {
    return 'LMS Backend is working!';
  }
}

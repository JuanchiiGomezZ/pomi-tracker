import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { TaskInstancesService } from './task-instances.service';
import {
  CompleteInstanceDto,
  SkipInstanceDto,
  UnskipInstanceDto,
  UpdateNotesDto,
  BatchCompleteDto,
  BatchSkipDto,
} from './dto/task-instance.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Task Instances')
@ApiBearerAuth()
@Controller('task-instances')
export class TaskInstancesController {
  constructor(private readonly taskInstancesService: TaskInstancesService) {}

  @Post(':taskId/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark task instance as completed' })
  @ApiResponse({ status: 200, description: 'Task completed' })
  complete(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: CompleteInstanceDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.taskInstancesService.complete(taskId, dto, user.id);
  }

  @Post(':taskId/uncomplete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark task instance as not completed' })
  @ApiResponse({ status: 200, description: 'Task marked as pending' })
  uncomplete(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Query('date') date: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.taskInstancesService.uncomplete(taskId, date, user.id);
  }

  @Post(':taskId/skip')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Skip task instance for today' })
  @ApiResponse({ status: 200, description: 'Task skipped' })
  skip(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: SkipInstanceDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.taskInstancesService.skip(taskId, dto, user.id);
  }

  @Post(':taskId/unskip')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unskip task instance' })
  @ApiResponse({ status: 200, description: 'Task unskipped' })
  unskip(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: UnskipInstanceDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.taskInstancesService.unskip(taskId, dto, user.id);
  }

  @Patch(':taskId/notes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update task instance notes' })
  @ApiResponse({ status: 200, description: 'Notes updated' })
  updateNotes(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: UpdateNotesDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.taskInstancesService.updateNotes(taskId, dto, user.id);
  }

  @Get('range')
  @ApiOperation({ summary: 'Get instances for date range' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  getInstancesForRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.taskInstancesService.getInstancesForDateRange(
      user.id,
      startDate,
      endDate,
    );
  }

  @Get('daily-summary')
  @ApiOperation({ summary: 'Get daily summary for a date' })
  @ApiQuery({ name: 'date', required: true, type: String })
  getDailySummary(
    @Query('date') date: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.taskInstancesService.getDailySummary(user.id, date);
  }

  @Get('today')
  @ApiOperation({ summary: 'Get today instances' })
  @ApiResponse({ status: 200, description: 'Today instances returned' })
  getToday(@CurrentUser() user: { id: string }) {
    return this.taskInstancesService.getTodayInstances(user.id);
  }

  @Post('batch-complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete all pending tasks for a date' })
  @ApiQuery({ name: 'date', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Tasks completed' })
  batchComplete(
    @Body() dto: BatchCompleteDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.taskInstancesService.batchComplete(user.id, dto);
  }

  @Post('batch-skip')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Skip all pending tasks for a date' })
  @ApiQuery({ name: 'date', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Tasks skipped' })
  batchSkip(@Body() dto: BatchSkipDto, @CurrentUser() user: { id: string }) {
    return this.taskInstancesService.batchSkip(user.id, dto);
  }
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { TasksService } from './tasks.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  ReorderTasksDto,
  getTasksForDateSchema,
} from './dto/task.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task (one-off or loop)' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  create(@Body() dto: CreateTaskDto, @CurrentUser() user: { id: string }) {
    return this.tasksService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks for current user' })
  @ApiQuery({ name: 'includeArchived', required: false, type: Boolean })
  findAll(
    @Query('includeArchived') includeArchived?: string,
    @CurrentUser() user?: { id: string },
  ) {
    if (!user) {
      throw new Error('User not authenticated');
    }
    return this.tasksService.findAll(user.id, includeArchived === 'true');
  }

  @Get('date')
  @ApiOperation({ summary: 'Get tasks for a specific date' })
  @ApiQuery({ name: 'date', required: true, type: String })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PENDING', 'COMPLETED', 'SKIPPED', 'ALL'],
  })
  @ApiQuery({ name: 'blockId', required: false, type: String })
  getTasksForDate(
    @Query('date') date: string,
    @Query('status') status?: string,
    @Query('blockId') blockId?: string,
    @CurrentUser() user?: { id: string },
  ) {
    if (!user) {
      throw new Error('User not authenticated');
    }
    const parsedParams = getTasksForDateSchema.parse({
      date,
      status: status || 'ALL',
      blockId,
    });
    return this.tasksService.getTasksForDate(parsedParams, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.tasksService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.tasksService.update(id, dto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete task (soft delete)' })
  @ApiResponse({ status: 204, description: 'Task deleted successfully' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.tasksService.remove(id, user.id);
  }

  @Post('reorder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reorder tasks' })
  @ApiResponse({ status: 200, description: 'Tasks reordered successfully' })
  reorder(@Body() dto: ReorderTasksDto, @CurrentUser() user: { id: string }) {
    return this.tasksService.reorder(dto, user.id);
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive task' })
  archive(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.tasksService.archive(id, user.id);
  }

  @Post(':id/unarchive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unarchive task' })
  unarchive(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.tasksService.unarchive(id, user.id);
  }
}

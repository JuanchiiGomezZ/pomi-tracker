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
import { BlocksService } from './blocks.service';
import {
  CreateBlockDto,
  UpdateBlockDto,
  ReorderBlocksDto,
} from './dto/block.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Blocks')
@ApiBearerAuth()
@Controller('blocks')
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new block' })
  @ApiResponse({ status: 201, description: 'Block created successfully' })
  create(@Body() dto: CreateBlockDto, @CurrentUser() user: { id: string }) {
    return this.blocksService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all blocks for current user' })
  @ApiQuery({ name: 'includeArchived', required: false, type: Boolean })
  findAll(
    @Query('includeArchived') includeArchived?: string,
    @CurrentUser() user?: { id: string },
  ) {
    return this.blocksService.findAll(
      user.id,
      includeArchived === 'true',
    );
  }

  @Get('today')
  @ApiOperation({ summary: 'Get active blocks for today' })
  @ApiQuery({ name: 'dayOfWeek', required: false, type: Number })
  getActiveForDay(
    @Query('dayOfWeek') dayOfWeek?: string,
    @CurrentUser() user?: { id: string },
  ) {
    const day = dayOfWeek
      ? parseInt(dayOfWeek, 10)
      : new Date().getDay();
    return this.blocksService.getActiveForDay(user.id, day);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get block by ID' })
  @ApiResponse({ status: 404, description: 'Block not found' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.blocksService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update block' })
  @ApiResponse({ status: 200, description: 'Block updated successfully' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBlockDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.blocksService.update(id, dto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete block (soft delete)' })
  @ApiResponse({ status: 204, description: 'Block deleted successfully' })
  @ApiResponse({ status: 400, description: 'Block has tasks, reassign required' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('reassignTo') reassignToBlockId?: string,
    @CurrentUser() user?: { id: string },
  ) {
    return this.blocksService.remove(
      id,
      user.id,
      reassignToBlockId,
    );
  }

  @Post('reorder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reorder blocks' })
  @ApiResponse({ status: 200, description: 'Blocks reordered successfully' })
  reorder(@Body() dto: ReorderBlocksDto, @CurrentUser() user: { id: string }) {
    return this.blocksService.reorder(dto, user.id);
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive block' })
  archive(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.blocksService.archive(id, user.id);
  }

  @Post(':id/unarchive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unarchive block' })
  unarchive(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.blocksService.unarchive(id, user.id);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
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
import { SyncService } from './sync.service';
import { PushSyncDto, type PullSyncQueryDto } from './dto/sync.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Sync')
@ApiBearerAuth()
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  /**
   * GET /sync/pull
   * Pull all changes from server since lastSyncAt
   */
  @Get('pull')
  @ApiOperation({ summary: 'Pull changes from server since last sync' })
  @ApiQuery({
    name: 'lastSyncAt',
    required: false,
    description: 'ISO timestamp of last sync',
  })
  @ApiResponse({ status: 200, description: 'Changes to sync' })
  pull(@Query() query: PullSyncQueryDto, @CurrentUser() user: { id: string }) {
    return this.syncService.pullChanges(user.id, query.lastSyncAt);
  }

  /**
   * POST /sync/push
   * Push changes made offline to the server
   */
  @Post('push')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Push offline changes to server' })
  @ApiResponse({ status: 200, description: 'Changes applied' })
  push(@Body() dto: PushSyncDto, @CurrentUser() user: { id: string }) {
    return this.syncService.pushChanges(user.id, dto);
  }

  /**
   * POST /sync
   * Full sync: pull + push in one request
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Full sync (pull changes, then push changes)' })
  @ApiResponse({ status: 200, description: 'Full sync result' })
  fullSync(@Body() dto: PushSyncDto, @CurrentUser() user: { id: string }) {
    return this.syncService.fullSync(user.id, dto);
  }

  /**
   * GET /sync/status
   * Get sync status for the current user
   */
  @Get('status')
  @ApiOperation({ summary: 'Get sync status and data counts' })
  @ApiResponse({ status: 200, description: 'Sync status' })
  getStatus(@CurrentUser() user: { id: string }) {
    return this.syncService.getSyncStatus(user.id);
  }
}

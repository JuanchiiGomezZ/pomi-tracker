import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { InsightsService } from './insights.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Insights')
@ApiBearerAuth()
@Controller('insights')
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get('calendar')
  @ApiOperation({ summary: 'Get calendar data for a month' })
  @ApiQuery({ name: 'year', required: true, type: Number })
  @ApiQuery({ name: 'month', required: true, type: Number })
  @ApiResponse({ status: 200, description: 'Calendar data returned' })
  getCalendar(
    @Query('year') year: string,
    @Query('month') month: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.insightsService.getCalendarData(
      user.id,
      parseInt(year, 10),
      parseInt(month, 10),
    );
  }

  @Get('heatmap')
  @ApiOperation({ summary: 'Get heatmap data for a year' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Heatmap data returned' })
  getHeatmap(
    @CurrentUser() user: { id: string },
    @Query('year') year?: string,
  ) {
    return this.insightsService.getHeatmapData(
      user.id,
      year ? parseInt(year, 10) : undefined,
    );
  }

  @Get('streak')
  @ApiOperation({ summary: 'Get current and best streak info' })
  @ApiResponse({ status: 200, description: 'Streak information returned' })
  getStreak(@CurrentUser() user: { id: string }) {
    return this.insightsService.getStreakInfo(user.id);
  }

  @Get('daily')
  @ApiOperation({ summary: 'Get completion stats for a specific date' })
  @ApiQuery({ name: 'date', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Daily stats returned' })
  getDailyStats(
    @Query('date') date: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.insightsService.getDailyCompletion(user.id, date);
  }

  @Get('weekly-averages')
  @ApiOperation({ summary: 'Get weekly completion averages' })
  @ApiResponse({ status: 200, description: 'Weekly averages returned' })
  getWeeklyAverages(@CurrentUser() user: { id: string }) {
    return this.insightsService.getWeeklyAverages(user.id);
  }

  @Get('summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get complete insights summary' })
  @ApiResponse({ status: 200, description: 'Insights summary returned' })
  getSummary(@CurrentUser() user: { id: string }) {
    return this.insightsService.getInsightsSummary(user.id);
  }
}

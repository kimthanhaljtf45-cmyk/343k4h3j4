import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CoachService } from './coach.service';
import { CoachInsightsService } from './coach-insights.service';
import { CompetitionsService } from '../competitions/competitions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('coach')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('COACH', 'ADMIN')
export class CoachController {
  constructor(
    private readonly coachService: CoachService,
    private readonly coachInsightsService: CoachInsightsService,
    private readonly competitionsService: CompetitionsService,
  ) {}

  @Get('insights')
  getInsights(@CurrentUser() user: any) {
    return this.coachInsightsService.getInsights(user.id);
  }

  @Get('schedules/today')
  getTodaySchedules(@CurrentUser() user: any) {
    return this.coachService.getTodaySchedules(user.id);
  }

  @Get('schedule/:scheduleId/attendance')
  getScheduleAttendance(@Param('scheduleId') scheduleId: string) {
    return this.coachService.getScheduleAttendance(scheduleId);
  }

  @Get('competitions/today')
  getTodayCompetitions(@CurrentUser() user: any) {
    return this.competitionsService.getTodayCompetitionsForCoach(user.id);
  }
}

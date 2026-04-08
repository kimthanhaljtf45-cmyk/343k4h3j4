import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminAnalyticsService } from './admin-analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(
    private readonly dashboardService: AdminDashboardService,
    private readonly analyticsService: AdminAnalyticsService,
  ) {}

  @Get('dashboard')
  getDashboard() {
    return this.dashboardService.getDashboard();
  }

  @Get('analytics')
  getAnalytics() {
    return this.analyticsService.getAnalytics();
  }

  @Get('groups')
  getGroups() {
    return this.dashboardService.getGroups();
  }

  @Get('groups/:id')
  getGroupDetail(@Param('id') id: string) {
    return this.dashboardService.getGroupDetail(id);
  }

  @Get('payments')
  getPayments(@Query('status') status?: string) {
    return this.dashboardService.getPayments(status);
  }

  @Get('students')
  getStudents(
    @Query('groupId') groupId?: string,
    @Query('belt') belt?: string,
    @Query('lowAttendance') lowAttendance?: string,
  ) {
    return this.dashboardService.getStudents({
      groupId,
      belt,
      lowAttendance: lowAttendance === 'true',
    });
  }
}

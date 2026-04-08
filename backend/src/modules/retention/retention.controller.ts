import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { RetentionService } from './retention.service';
import { RetentionEngine } from './retention.engine';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('retention')
@UseGuards(JwtAuthGuard)
export class RetentionController {
  constructor(
    private readonly retentionService: RetentionService,
    private readonly retentionEngine: RetentionEngine,
  ) {}

  @Get('child/:childId')
  async getChildRetention(@Param('childId') childId: string) {
    const snapshot = await this.retentionService.getByChild(childId);
    if (!snapshot) {
      return {
        streak: 0,
        monthlyGoal: { target: 12, current: 0, percent: 0 },
        engagementStatus: 'stable',
        dropOffRisk: 'low',
        recommendations: [],
        recentAchievements: [],
      };
    }

    return {
      childId: snapshot.entityId,
      streak: snapshot.streak,
      monthlyGoal: {
        target: snapshot.monthlyGoalTarget,
        current: snapshot.monthlyGoalCurrent,
        percent: snapshot.monthlyGoalTarget > 0 
          ? Math.round((snapshot.monthlyGoalCurrent / snapshot.monthlyGoalTarget) * 100)
          : 0,
      },
      engagementStatus: snapshot.engagementStatus,
      dropOffRisk: snapshot.dropOffRisk,
      nextMilestone: snapshot.nextMilestone,
      recentAchievements: snapshot.recentAchievements,
      recommendations: snapshot.recommendations,
      attendanceRate: snapshot.attendanceRate,
      daysSinceLastVisit: snapshot.daysSinceLastVisit,
    };
  }

  @Get('parent')
  async getParentRetention(@Request() req: any) {
    const parentId = req.user.sub;
    const snapshot = await this.retentionService.getByParent(parentId);
    return snapshot || { message: 'No retention data available' };
  }

  @Get('student/me')
  async getMyRetention(@Request() req: any) {
    const studentId = req.user.sub;
    const snapshot = await this.retentionService.getByStudent(studentId);
    
    if (!snapshot) {
      return {
        streak: 0,
        monthlyGoal: { target: 12, current: 0, percent: 0 },
        engagementStatus: 'stable',
        dropOffRisk: 'low',
        recommendations: [],
      };
    }

    return {
      streak: snapshot.streak,
      monthlyGoal: {
        target: snapshot.monthlyGoalTarget,
        current: snapshot.monthlyGoalCurrent,
        percent: snapshot.monthlyGoalTarget > 0 
          ? Math.round((snapshot.monthlyGoalCurrent / snapshot.monthlyGoalTarget) * 100)
          : 0,
      },
      engagementStatus: snapshot.engagementStatus,
      dropOffRisk: snapshot.dropOffRisk,
      nextMilestone: snapshot.nextMilestone,
      recentAchievements: snapshot.recentAchievements,
      recommendations: snapshot.recommendations,
    };
  }

  @Get('coach/risks')
  @UseGuards(RolesGuard)
  @Roles('COACH', 'ADMIN')
  async getCoachRisks() {
    const atRisk = await this.retentionService.getAtRisk();
    return {
      total: atRisk.length,
      critical: atRisk.filter(s => s.dropOffRisk === 'critical').length,
      warning: atRisk.filter(s => s.dropOffRisk === 'warning').length,
      items: atRisk.map(s => ({
        entityId: s.entityId,
        entityType: s.entityType,
        riskScore: s.riskScore,
        dropOffRisk: s.dropOffRisk,
        daysSinceLastVisit: s.daysSinceLastVisit,
        attendanceRate: s.attendanceRate,
      })),
    };
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getStats() {
    return this.retentionService.getRetentionStats();
  }

  @Post('recalculate')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async recalculate() {
    return this.retentionEngine.recalculateAll();
  }

  @Post('recalculate/child/:childId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'COACH')
  async recalculateChild(@Param('childId') childId: string) {
    await this.retentionEngine.recalculateChild(childId);
    return { success: true };
  }
}

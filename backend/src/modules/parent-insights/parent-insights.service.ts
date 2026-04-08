import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Child, ChildDocument } from '../../schemas/child.schema';
import { Attendance, AttendanceDocument } from '../../schemas/attendance.schema';
import { ParentChild, ParentChildDocument } from '../../schemas/parent-child.schema';
import { ProgressSnapshot, ProgressSnapshotDocument } from '../../schemas/progress-snapshot.schema';
import { Achievement, AchievementDocument } from '../../schemas/achievement.schema';
import { CoachComment, CoachCommentDocument } from '../../schemas/coach-comment.schema';
import { Schedule, ScheduleDocument } from '../../schemas/schedule.schema';

interface Alert {
  type: string;
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
}

interface Recommendation {
  type: string;
  title: string;
  action?: string;
}

export interface ChildInsight {
  childId: string;
  name: string;
  status: 'good' | 'warning' | 'critical';
  discipline: number;
  attendance: number;
  progressPercent: number;
  belt: string;
  alerts: Alert[];
  recommendations: Recommendation[];
  monthlyGoal: { target: number; current: number };
  lastCoachComment?: string;
  recentAchievements: any[];
}

@Injectable()
export class ParentInsightsService {
  constructor(
    @InjectModel(Child.name) private childModel: Model<ChildDocument>,
    @InjectModel(Attendance.name) private attendanceModel: Model<AttendanceDocument>,
    @InjectModel(ParentChild.name) private parentChildModel: Model<ParentChildDocument>,
    @InjectModel(ProgressSnapshot.name) private progressModel: Model<ProgressSnapshotDocument>,
    @InjectModel(Achievement.name) private achievementModel: Model<AchievementDocument>,
    @InjectModel(CoachComment.name) private commentModel: Model<CoachCommentDocument>,
    @InjectModel(Schedule.name) private scheduleModel: Model<ScheduleDocument>,
  ) {}

  async getInsights(parentId: string): Promise<{ children: ChildInsight[] }> {
    // Get parent's children
    const parentChildren = await this.parentChildModel.find({ parentId });
    const childIds = parentChildren.map(pc => pc.childId);

    const children = await this.childModel.find({ _id: { $in: childIds } });

    const childInsights = await Promise.all(
      children.map(child => this.buildChildInsights(child)),
    );

    return { children: childInsights };
  }

  private async buildChildInsights(child: ChildDocument): Promise<ChildInsight> {
    const childId = child._id.toString();

    // Get attendance stats for current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const attendances = await this.attendanceModel.find({
      childId,
      date: { $gte: startOfMonth.toISOString().split('T')[0] },
    });

    const totalAttendances = attendances.length;
    const presentCount = attendances.filter(a => a.status === 'PRESENT').length;
    const warnedCount = attendances.filter(a => a.status === 'WARNED').length;
    const absentCount = attendances.filter(a => a.status === 'ABSENT').length;

    // Calculate attendance percentage
    const attendancePercent = totalAttendances > 0 
      ? Math.round((presentCount / totalAttendances) * 100) 
      : 100;

    // Calculate discipline score (based on absences and warnings)
    let disciplineScore = 100;
    disciplineScore -= absentCount * 15;
    disciplineScore -= warnedCount * 5;
    disciplineScore = Math.max(0, Math.min(100, disciplineScore));

    // Check for consecutive absences
    const recentAttendances = await this.attendanceModel
      .find({ childId })
      .sort({ date: -1 })
      .limit(5);
    
    const consecutiveAbsences = this.countConsecutiveAbsences(recentAttendances);

    // Get progress snapshot
    const progress = await this.progressModel.findOne({ childId });
    const progressPercent = progress?.progressPercent || 0;

    // Get recent achievements
    const recentAchievements = await this.achievementModel
      .find({ childId })
      .sort({ awardedAt: -1 })
      .limit(3);

    // Get last coach comment
    const lastComment = await this.commentModel
      .findOne({ childId })
      .sort({ createdAt: -1 });

    // Build alerts and recommendations
    const alerts: Alert[] = [];
    const recommendations: Recommendation[] = [];

    // LOW ATTENDANCE ALERT
    if (attendancePercent < 50) {
      alerts.push({
        type: 'CRITICAL_ATTENDANCE',
        title: 'Критична відвідуваність',
        message: `Менше 50% тренувань (${attendancePercent}%)`,
        severity: 'critical',
      });
      recommendations.push({
        type: 'ATTEND_URGENTLY',
        title: 'Терміново відвідати тренування',
        action: 'Зверніться до тренера',
      });
    } else if (attendancePercent < 70) {
      alerts.push({
        type: 'LOW_ATTENDANCE',
        title: 'Низька відвідуваність',
        message: `${attendancePercent}% тренувань`,
        severity: 'warning',
      });
      recommendations.push({
        type: 'ATTEND_MORE',
        title: 'Рекомендуємо відвідати 2 тренування цього тижня',
      });
    }

    // CONSECUTIVE ABSENCES
    if (consecutiveAbsences >= 3) {
      alerts.push({
        type: 'CONSECUTIVE_ABSENCES',
        title: 'Серія пропусків',
        message: `${consecutiveAbsences} тренувань поспіль пропущено`,
        severity: 'critical',
      });
    } else if (consecutiveAbsences >= 2) {
      alerts.push({
        type: 'ABSENCES_WARNING',
        title: 'Падає дисципліна',
        message: `Пропущено ${consecutiveAbsences} тренування поспіль`,
        severity: 'warning',
      });
    }

    // LOW DISCIPLINE
    if (disciplineScore < 60) {
      alerts.push({
        type: 'LOW_DISCIPLINE',
        title: 'Низька дисципліна',
        message: `Показник дисципліни: ${disciplineScore}%`,
        severity: 'warning',
      });
    }

    // BELT READINESS
    if (progressPercent >= 85) {
      alerts.push({
        type: 'READY_FOR_BELT',
        title: 'Готовий до поясу!',
        message: 'Прогрес досяг 85%, можна подаватись на атестацію',
        severity: 'info',
      });
      recommendations.push({
        type: 'CONTACT_COACH',
        title: 'Зверніться до тренера щодо атестації',
      });
    }

    // GOOD PROGRESS
    if (progressPercent >= 70 && progressPercent < 85) {
      recommendations.push({
        type: 'KEEP_TRAINING',
        title: 'Відмінний прогрес! Продовжуйте в тому ж дусі',
      });
    }

    // Determine overall status
    let status: 'good' | 'warning' | 'critical' = 'good';
    if (alerts.some(a => a.severity === 'critical')) {
      status = 'critical';
    } else if (alerts.some(a => a.severity === 'warning')) {
      status = 'warning';
    }

    const monthlyGoalTarget = child.monthlyGoalTarget || 12;

    return {
      childId,
      name: child.firstName,
      status,
      discipline: disciplineScore,
      attendance: attendancePercent,
      progressPercent,
      belt: child.belt || 'WHITE',
      alerts,
      recommendations,
      monthlyGoal: {
        target: monthlyGoalTarget,
        current: presentCount,
      },
      lastCoachComment: lastComment?.text,
      recentAchievements: recentAchievements.map(a => ({
        id: a._id.toString(),
        title: a.title,
        type: a.type,
        awardedAt: a.awardedAt,
      })),
    };
  }

  private countConsecutiveAbsences(attendances: AttendanceDocument[]): number {
    let count = 0;
    for (const a of attendances) {
      if (a.status === 'ABSENT') {
        count++;
      } else if (a.status === 'PRESENT') {
        break;
      }
    }
    return count;
  }
}

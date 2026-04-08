import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Child, ChildDocument } from '../../schemas/child.schema';
import { User, UserDocument } from '../../schemas/user.schema';
import { Group, GroupDocument } from '../../schemas/group.schema';
import { Attendance, AttendanceDocument } from '../../schemas/attendance.schema';
import { Payment, PaymentDocument } from '../../schemas/payment.schema';
import { SmartAlert, SmartAlertDocument } from '../../schemas/smart-alert.schema';

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectModel(Child.name) private childModel: Model<ChildDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Group.name) private groupModel: Model<GroupDocument>,
    @InjectModel(Attendance.name) private attendanceModel: Model<AttendanceDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(SmartAlert.name) private alertModel: Model<SmartAlertDocument>,
  ) {}

  async getDashboard() {
    const [
      kpi,
      attendance,
      discipline,
      belts,
      revenue,
      alerts,
    ] = await Promise.all([
      this.getKPI(),
      this.getAttendanceStats(),
      this.getDisciplineStats(),
      this.getBeltDistribution(),
      this.getRevenue(),
      this.getAlerts(),
    ]);

    return {
      kpi,
      attendance,
      discipline,
      belts,
      revenue,
      alerts,
    };
  }

  private async getKPI() {
    const totalStudents = await this.childModel.countDocuments({});
    const parentsCount = await this.userModel.countDocuments({ role: 'PARENT' });
    const coachesCount = await this.userModel.countDocuments({ role: 'COACH' });

    const today = new Date().toISOString().slice(0, 10);
    const todayAttendance = await this.attendanceModel.find({ date: today });

    const present = todayAttendance.filter((x) => x.status === 'PRESENT').length;
    const attendanceRate = todayAttendance.length
      ? Math.round((present / todayAttendance.length) * 100)
      : 0;

    // Calculate average discipline
    const allAttendance = await this.attendanceModel.find({});
    const totalRecords = allAttendance.length;
    const presentTotal = allAttendance.filter((x) => x.status === 'PRESENT').length;
    const warnedTotal = allAttendance.filter((x) => x.status === 'WARNED').length;
    const lateTotal = allAttendance.filter((x) => x.status === 'LATE').length;

    const weighted = presentTotal * 1.0 + warnedTotal * 0.6 + lateTotal * 0.5;
    const disciplineAvg = totalRecords > 0 ? Math.round((weighted / totalRecords) * 100) : 0;

    return {
      totalStudents,
      parentsCount,
      coachesCount,
      activeToday: present,
      attendanceRate,
      disciplineAvg,
    };
  }

  private async getAttendanceStats() {
    const today = new Date().toISOString().slice(0, 10);
    const records = await this.attendanceModel.find({ date: today });

    const present = records.filter((x) => x.status === 'PRESENT').length;
    const absent = records.filter((x) => x.status === 'ABSENT').length;
    const warned = records.filter((x) => x.status === 'WARNED').length;
    const late = records.filter((x) => x.status === 'LATE').length;

    // Calculate trend (compare with yesterday)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    const yesterdayRecords = await this.attendanceModel.find({ date: yesterdayStr });
    const yesterdayPresent = yesterdayRecords.filter((x) => x.status === 'PRESENT').length;

    let trend = 'stable';
    if (records.length > 0 && yesterdayRecords.length > 0) {
      const todayRate = present / records.length;
      const yesterdayRate = yesterdayPresent / yesterdayRecords.length;
      if (todayRate > yesterdayRate + 0.05) trend = 'up';
      else if (todayRate < yesterdayRate - 0.05) trend = 'down';
    }

    return {
      today: { present, absent, warned, late },
      trend,
    };
  }

  private async getDisciplineStats() {
    const groups = await this.groupModel.find({});
    const groupScores: Array<{ name: string; score: number }> = [];

    for (const group of groups) {
      const children = await this.childModel.find({ groupId: group._id.toString() });
      const childIds = children.map((c) => c._id.toString());

      const attendance = await this.attendanceModel.find({ childId: { $in: childIds } });
      if (attendance.length === 0) {
        groupScores.push({ name: group.name, score: 0 });
        continue;
      }

      const present = attendance.filter((a) => a.status === 'PRESENT').length;
      const warned = attendance.filter((a) => a.status === 'WARNED').length;
      const late = attendance.filter((a) => a.status === 'LATE').length;

      const weighted = present * 1.0 + warned * 0.6 + late * 0.5;
      const score = Math.round((weighted / attendance.length) * 100);
      groupScores.push({ name: group.name, score });
    }

    groupScores.sort((a, b) => b.score - a.score);

    const avgScore = groupScores.length > 0
      ? Math.round(groupScores.reduce((acc, g) => acc + g.score, 0) / groupScores.length)
      : 0;

    return {
      avg: avgScore,
      topGroup: groupScores[0]?.name || null,
      worstGroup: groupScores[groupScores.length - 1]?.name || null,
      groups: groupScores,
    };
  }

  private async getBeltDistribution() {
    const children = await this.childModel.find({});
    const map: Record<string, number> = {};

    for (const c of children) {
      const belt = c.belt || 'WHITE';
      map[belt] = (map[belt] || 0) + 1;
    }

    return map;
  }

  private async getRevenue() {
    const payments = await this.paymentModel.find({});

    const month = payments
      .filter((p) => p.status === 'PAID')
      .reduce((acc, p) => acc + (p.amount || 0), 0);

    const pending = payments
      .filter((p) => p.status !== 'PAID')
      .reduce((acc, p) => acc + (p.amount || 0), 0);

    const overdueCount = payments.filter((p) =>
      p.status === 'PENDING' || p.status === 'UNDER_REVIEW'
    ).length;

    return {
      month,
      pending,
      overdueCount,
    };
  }

  private async getAlerts() {
    const alerts: Array<{ type: string; message: string; severity: string; value?: any }> = [];

    // Check low attendance groups
    const groups = await this.groupModel.find({});
    for (const group of groups) {
      const children = await this.childModel.find({ groupId: group._id.toString() });
      const childIds = children.map((c) => c._id.toString());

      const attendance = await this.attendanceModel.find({ childId: { $in: childIds } });
      if (attendance.length === 0) continue;

      const present = attendance.filter((a) => a.status === 'PRESENT').length;
      const rate = Math.round((present / attendance.length) * 100);

      if (rate < 70) {
        alerts.push({
          type: 'LOW_ATTENDANCE',
          message: `Група "${group.name}" має низьку відвідуваність: ${rate}%`,
          severity: rate < 50 ? 'critical' : 'warning',
          value: rate,
        });
      }
    }

    // Check overdue payments
    const overduePayments = await this.paymentModel.countDocuments({
      status: { $in: ['PENDING', 'UNDER_REVIEW'] },
    });

    if (overduePayments > 0) {
      alerts.push({
        type: 'PAYMENT_OVERDUE',
        message: `${overduePayments} неоплачених рахунків`,
        severity: overduePayments > 10 ? 'critical' : 'warning',
        value: overduePayments,
      });
    }

    return alerts;
  }

  // Admin groups list with stats
  async getGroups() {
    const groups = await this.groupModel.find({});
    const result = [];

    for (const group of groups) {
      const children = await this.childModel.find({ groupId: group._id.toString() });
      const childIds = children.map((c) => c._id.toString());

      const attendance = await this.attendanceModel.find({ childId: { $in: childIds } });
      const total = attendance.length;
      const present = attendance.filter((a) => a.status === 'PRESENT').length;

      const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

      // Discipline
      const warned = attendance.filter((a) => a.status === 'WARNED').length;
      const late = attendance.filter((a) => a.status === 'LATE').length;
      const weighted = present * 1.0 + warned * 0.6 + late * 0.5;
      const discipline = total > 0 ? Math.round((weighted / total) * 100) : 0;

      // Coach
      let coach = null;
      if (group.coachId) {
        const coachUser = await this.userModel.findById(group.coachId);
        if (coachUser) {
          coach = {
            id: coachUser._id.toString(),
            name: `${coachUser.firstName} ${coachUser.lastName || ''}`.trim(),
          };
        }
      }

      result.push({
        id: group._id.toString(),
        name: group.name,
        students: children.length,
        attendanceRate,
        discipline,
        coach,
      });
    }

    return result;
  }

  // Admin group detail
  async getGroupDetail(groupId: string) {
    const group = await this.groupModel.findById(groupId);
    if (!group) return null;

    const children = await this.childModel.find({ groupId });
    const studentsData = [];

    for (const child of children) {
      const attendance = await this.attendanceModel.find({ childId: child._id.toString() });
      const total = attendance.length;
      const present = attendance.filter((a) => a.status === 'PRESENT').length;
      const warned = attendance.filter((a) => a.status === 'WARNED').length;
      const late = attendance.filter((a) => a.status === 'LATE').length;

      const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
      const weighted = present * 1.0 + warned * 0.6 + late * 0.5;
      const discipline = total > 0 ? Math.round((weighted / total) * 100) : 0;

      studentsData.push({
        id: child._id.toString(),
        name: `${child.firstName} ${child.lastName || ''}`.trim(),
        belt: child.belt || 'WHITE',
        attendance: attendanceRate,
        discipline,
      });
    }

    // Coach
    let coach = null;
    if (group.coachId) {
      const coachUser = await this.userModel.findById(group.coachId);
      if (coachUser) {
        coach = `${coachUser.firstName} ${coachUser.lastName || ''}`.trim();
      }
    }

    return {
      group: {
        id: group._id.toString(),
        name: group.name,
        coach,
      },
      students: studentsData,
    };
  }

  // Admin payments list
  async getPayments(status?: string) {
    const query: any = {};
    if (status === 'overdue') {
      query.status = { $in: ['PENDING', 'UNDER_REVIEW'] };
    } else if (status) {
      query.status = status;
    }

    const payments = await this.paymentModel.find(query).sort({ createdAt: -1 });
    const result = [];

    for (const p of payments) {
      const child = await this.childModel.findById(p.childId);
      result.push({
        id: p._id.toString(),
        childId: p.childId,
        childName: child ? `${child.firstName} ${child.lastName || ''}`.trim() : 'Невідомо',
        amount: p.amount,
        currency: p.currency || 'UAH',
        status: p.status,
        dueDate: p.dueDate,
        description: p.description,
      });
    }

    return result;
  }

  // Admin students list
  async getStudents(filters?: { groupId?: string; belt?: string; lowAttendance?: boolean }) {
    const query: any = {};
    if (filters?.groupId) query.groupId = filters.groupId;
    if (filters?.belt) query.belt = filters.belt;

    const children = await this.childModel.find(query);
    const result = [];

    for (const child of children) {
      const attendance = await this.attendanceModel.find({ childId: child._id.toString() });
      const total = attendance.length;
      const present = attendance.filter((a) => a.status === 'PRESENT').length;
      const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

      if (filters?.lowAttendance && attendanceRate >= 70) continue;

      const group = child.groupId ? await this.groupModel.findById(child.groupId) : null;

      result.push({
        id: child._id.toString(),
        name: `${child.firstName} ${child.lastName || ''}`.trim(),
        belt: child.belt || 'WHITE',
        attendance: attendanceRate,
        groupName: group?.name || null,
      });
    }

    return result;
  }
}

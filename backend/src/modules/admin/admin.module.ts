import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminAnalyticsService } from './admin-analytics.service';
import { Child, ChildSchema } from '../../schemas/child.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { Group, GroupSchema } from '../../schemas/group.schema';
import { Attendance, AttendanceSchema } from '../../schemas/attendance.schema';
import { Payment, PaymentSchema } from '../../schemas/payment.schema';
import { SmartAlert, SmartAlertSchema } from '../../schemas/smart-alert.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Child.name, schema: ChildSchema },
      { name: User.name, schema: UserSchema },
      { name: Group.name, schema: GroupSchema },
      { name: Attendance.name, schema: AttendanceSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: SmartAlert.name, schema: SmartAlertSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminDashboardService, AdminAnalyticsService],
  exports: [AdminDashboardService, AdminAnalyticsService],
})
export class AdminModule {}

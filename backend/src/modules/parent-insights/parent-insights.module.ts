import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ParentInsightsController } from './parent-insights.controller';
import { ParentInsightsService } from './parent-insights.service';
import { Child, ChildSchema } from '../../schemas/child.schema';
import { Attendance, AttendanceSchema } from '../../schemas/attendance.schema';
import { ParentChild, ParentChildSchema } from '../../schemas/parent-child.schema';
import { ProgressSnapshot, ProgressSnapshotSchema } from '../../schemas/progress-snapshot.schema';
import { Achievement, AchievementSchema } from '../../schemas/achievement.schema';
import { CoachComment, CoachCommentSchema } from '../../schemas/coach-comment.schema';
import { Group, GroupSchema } from '../../schemas/group.schema';
import { Schedule, ScheduleSchema } from '../../schemas/schedule.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Child.name, schema: ChildSchema },
      { name: Attendance.name, schema: AttendanceSchema },
      { name: ParentChild.name, schema: ParentChildSchema },
      { name: ProgressSnapshot.name, schema: ProgressSnapshotSchema },
      { name: Achievement.name, schema: AchievementSchema },
      { name: CoachComment.name, schema: CoachCommentSchema },
      { name: Group.name, schema: GroupSchema },
      { name: Schedule.name, schema: ScheduleSchema },
    ]),
  ],
  controllers: [ParentInsightsController],
  providers: [ParentInsightsService],
  exports: [ParentInsightsService],
})
export class ParentInsightsModule {}

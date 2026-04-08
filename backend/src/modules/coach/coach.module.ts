import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CoachController } from './coach.controller';
import { CoachService } from './coach.service';
import { CoachInsightsService } from './coach-insights.service';
import { Schedule, ScheduleSchema } from '../../schemas/schedule.schema';
import { Group, GroupSchema } from '../../schemas/group.schema';
import { Location, LocationSchema } from '../../schemas/location.schema';
import { Child, ChildSchema } from '../../schemas/child.schema';
import { Attendance, AttendanceSchema } from '../../schemas/attendance.schema';
import { CompetitionsModule } from '../competitions/competitions.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Schedule.name, schema: ScheduleSchema },
      { name: Group.name, schema: GroupSchema },
      { name: Location.name, schema: LocationSchema },
      { name: Child.name, schema: ChildSchema },
      { name: Attendance.name, schema: AttendanceSchema },
    ]),
    forwardRef(() => CompetitionsModule),
  ],
  controllers: [CoachController],
  providers: [CoachService, CoachInsightsService],
  exports: [CoachService, CoachInsightsService],
})
export class CoachModule {}

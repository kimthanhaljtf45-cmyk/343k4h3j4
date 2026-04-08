import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LtvService } from './ltv.service';
import { Child, ChildSchema } from '../../schemas/child.schema';
import { Payment, PaymentSchema } from '../../schemas/payment.schema';
import { Attendance, AttendanceSchema } from '../../schemas/attendance.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Child.name, schema: ChildSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Attendance.name, schema: AttendanceSchema },
    ]),
  ],
  providers: [LtvService],
  exports: [LtvService],
})
export class LtvModule {}

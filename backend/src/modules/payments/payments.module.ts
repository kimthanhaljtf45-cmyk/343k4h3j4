import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Payment, PaymentSchema } from '../../schemas/payment.schema';
import { Child, ChildSchema } from '../../schemas/child.schema';
import { ParentChild, ParentChildSchema } from '../../schemas/parent-child.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: Child.name, schema: ChildSchema },
      { name: ParentChild.name, schema: ParentChildSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}

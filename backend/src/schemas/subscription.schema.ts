import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SubscriptionDocument = Subscription & Document;

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ required: true })
  childId: string;

  @Prop({ required: true })
  parentId: string;

  @Prop({ default: 'Місячний абонемент' })
  planName: string;

  @Prop({ required: true })
  price: number;

  @Prop({ default: 'UAH' })
  currency: string;

  @Prop({ default: 'MONTHLY' })
  billingCycle: string;

  @Prop({ required: true, min: 1, max: 28 })
  dueDay: number;

  @Prop({ type: Date })
  startDate: Date;

  @Prop({ type: Date })
  endDate: Date;

  @Prop({ default: 'ACTIVE', enum: ['ACTIVE', 'PAUSED', 'CANCELLED'] })
  status: string;

  @Prop({ type: Date })
  lastBilledAt: Date;

  @Prop({ type: Date })
  nextBillingAt: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

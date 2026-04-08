import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

// FROZEN DOMAIN MODEL - DO NOT MODIFY
export type UserRole = 'PARENT' | 'STUDENT' | 'COACH' | 'ADMIN';
export type ProgramType = 'KIDS' | 'SPECIAL' | 'SELF_DEFENSE' | 'MENTORSHIP' | 'CONSULTATION';

@Schema({ timestamps: true })
export class User {
  @Prop()
  firstName: string;

  @Prop()
  lastName?: string;

  @Prop()
  username?: string;

  @Prop({ unique: true, sparse: true })
  phone?: string;

  @Prop({ unique: true, sparse: true })
  telegramId?: string;

  @Prop({ unique: true, sparse: true })
  email?: string;

  @Prop({ unique: true, sparse: true })
  googleId?: string;

  @Prop({ default: 'PARENT' })
  role: UserRole;

  @Prop({ default: 'ACTIVE' })
  status: string;

  @Prop()
  avatarUrl?: string;

  // Program-aware fields
  @Prop({ default: 'KIDS' })
  programType: ProgramType;

  @Prop({ default: false })
  isOnboarded: boolean;

  @Prop()
  onboardingStage?: string;

  // Referral system
  @Prop({ unique: true, sparse: true })
  referralCode?: string;

  @Prop()
  referredBy?: string; // userId who referred this user
}

export const UserSchema = SchemaFactory.createForClass(User);

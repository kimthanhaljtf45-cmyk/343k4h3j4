import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ClubDocument = HydratedDocument<Club>;

@Schema({ timestamps: true })
export class Club {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  address: string;

  @Prop()
  phone?: string;

  @Prop()
  city?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const ClubSchema = SchemaFactory.createForClass(Club);

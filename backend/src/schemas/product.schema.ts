import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  price: number;

  @Prop()
  oldPrice?: number;

  @Prop({ required: true, enum: ['EQUIPMENT', 'UNIFORM', 'PROTECTION', 'ACCESSORIES', 'NUTRITION'] })
  category: string;

  @Prop({ type: [String], default: [] })
  subcategories: string[];

  @Prop({ required: true, enum: ['KARATE', 'TAEKWONDO', 'BOXING', 'MMA', 'JUDO', 'WRESTLING', 'UNIVERSAL'] })
  sportType: string;

  @Prop({ enum: ['TRAINING', 'COMPETITION', 'BOTH'], default: 'BOTH' })
  usageType: string;

  @Prop({ type: [String], default: [] })
  sizes: string[];

  @Prop({ type: Object })
  sizeChart?: {
    ageMin?: number;
    ageMax?: number;
    heightMin?: number;
    heightMax?: number;
    weightMin?: number;
    weightMax?: number;
  };

  @Prop({ type: [String], default: [] })
  colors: string[];

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ default: 0 })
  stock: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ default: false })
  isNewArrival: boolean;

  @Prop({ default: 0 })
  rating: number;

  @Prop({ default: 0 })
  reviewsCount: number;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop()
  brand?: string;

  @Prop()
  sku?: string;

  @Prop({ type: Types.ObjectId, ref: 'Tenant' })
  tenantId?: Types.ObjectId;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ category: 1, sportType: 1, isActive: 1 });
ProductSchema.index({ price: 1 });

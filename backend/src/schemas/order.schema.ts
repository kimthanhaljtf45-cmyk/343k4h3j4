import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

@Schema()
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  quantity: number;

  @Prop()
  size?: string;

  @Prop()
  color?: string;

  @Prop({ required: true })
  price: number;
}

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: [OrderItem], required: true })
  items: OrderItem[];

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ enum: ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'], default: 'PENDING' })
  status: string;

  @Prop()
  shippingAddress?: string;

  @Prop()
  phone?: string;

  @Prop()
  comment?: string;

  @Prop({ enum: ['PICKUP', 'DELIVERY', 'NOVA_POSHTA'], default: 'PICKUP' })
  deliveryMethod: string;

  @Prop()
  trackingNumber?: string;

  @Prop()
  paymentId?: string;

  @Prop({ type: Types.ObjectId, ref: 'Child' })
  childId?: Types.ObjectId;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);
export const OrderSchema = SchemaFactory.createForClass(Order);

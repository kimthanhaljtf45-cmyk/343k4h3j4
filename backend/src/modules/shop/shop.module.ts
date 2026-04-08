import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShopController } from './shop.controller';
import { ShopService } from './shop.service';
import { ProductSchema } from '../../schemas/product.schema';
import { CartSchema } from '../../schemas/cart.schema';
import { OrderSchema } from '../../schemas/order.schema';
import { UserSchema } from '../../schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Product', schema: ProductSchema },
      { name: 'Cart', schema: CartSchema },
      { name: 'Order', schema: OrderSchema },
      { name: 'User', schema: UserSchema },
    ]),
  ],
  controllers: [ShopController],
  providers: [ShopService],
  exports: [ShopService],
})
export class ShopModule {}

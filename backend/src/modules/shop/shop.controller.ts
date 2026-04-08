import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ShopService } from './shop.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  // ========== PRODUCTS (Public) ==========
  
  @Get('products')
  @Public()
  getProducts(
    @Query('category') category?: string,
    @Query('sportType') sportType?: string,
    @Query('usageType') usageType?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('size') size?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: string,
    @Query('featured') featured?: string,
    @Query('limit') limit?: string,
  ) {
    return this.shopService.getProducts({
      category,
      sportType,
      usageType,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      size,
      search,
      sort,
      featured: featured === 'true',
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('products/recommendations')
  @Public()
  getRecommendations(
    @Query('age') age?: string,
    @Query('height') height?: string,
    @Query('weight') weight?: string,
    @Query('sportType') sportType?: string,
    @Query('usageType') usageType?: string,
  ) {
    return this.shopService.getRecommendations({
      age: age ? parseInt(age) : undefined,
      height: height ? parseInt(height) : undefined,
      weight: weight ? parseInt(weight) : undefined,
      sportType,
      usageType,
    });
  }

  @Get('products/categories')
  @Public()
  getCategories() {
    return this.shopService.getCategories();
  }

  @Get('products/:id')
  @Public()
  getProduct(@Param('id') id: string) {
    return this.shopService.getProductById(id);
  }

  // ========== CART (Authenticated) ==========

  @UseGuards(JwtAuthGuard)
  @Get('cart')
  getCart(@Request() req: any) {
    return this.shopService.getCart(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('cart/add')
  addToCart(
    @Request() req: any,
    @Body() body: { productId: string; quantity: number; size?: string; color?: string },
  ) {
    return this.shopService.addToCart(req.user.sub, body);
  }

  @UseGuards(JwtAuthGuard)
  @Put('cart/update')
  updateCartItem(
    @Request() req: any,
    @Body() body: { productId: string; quantity: number; size?: string; color?: string },
  ) {
    return this.shopService.updateCartItem(req.user.sub, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('cart/remove/:productId')
  removeFromCart(@Request() req: any, @Param('productId') productId: string) {
    return this.shopService.removeFromCart(req.user.sub, productId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('cart/clear')
  clearCart(@Request() req: any) {
    return this.shopService.clearCart(req.user.sub);
  }

  // ========== ORDERS (Authenticated) ==========

  @UseGuards(JwtAuthGuard)
  @Post('orders')
  createOrder(
    @Request() req: any,
    @Body() body: {
      deliveryMethod: string;
      shippingAddress?: string;
      phone?: string;
      comment?: string;
      childId?: string;
    },
  ) {
    return this.shopService.createOrder(req.user.sub, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders')
  getOrders(@Request() req: any) {
    return this.shopService.getOrders(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders/:id')
  getOrder(@Request() req: any, @Param('id') id: string) {
    return this.shopService.getOrderById(req.user.sub, id);
  }

  // ========== ADMIN (For adding products) ==========

  @UseGuards(JwtAuthGuard)
  @Post('products')
  createProduct(@Request() req: any, @Body() body: any) {
    return this.shopService.createProduct(req.user.sub, body);
  }

  @UseGuards(JwtAuthGuard)
  @Put('products/:id')
  updateProduct(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.shopService.updateProduct(req.user.sub, id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('products/:id')
  deleteProduct(@Request() req: any, @Param('id') id: string) {
    return this.shopService.deleteProduct(req.user.sub, id);
  }
}

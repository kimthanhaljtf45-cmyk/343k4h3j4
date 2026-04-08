import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

interface ProductFilter {
  category?: string;
  sportType?: string;
  usageType?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  search?: string;
  sort?: string;
  featured?: boolean;
  limit?: number;
}

interface RecommendationParams {
  age?: number;
  height?: number;
  weight?: number;
  sportType?: string;
  usageType?: string;
}

@Injectable()
export class ShopService {
  constructor(
    @InjectModel('Product') private productModel: Model<any>,
    @InjectModel('Cart') private cartModel: Model<any>,
    @InjectModel('Order') private orderModel: Model<any>,
    @InjectModel('User') private userModel: Model<any>,
  ) {}

  // ========== PRODUCTS ==========

  async getProducts(filter: ProductFilter) {
    const query: any = { isActive: true };

    if (filter.category) query.category = filter.category;
    if (filter.sportType) query.sportType = filter.sportType;
    if (filter.usageType) query.usageType = filter.usageType;
    if (filter.featured) query.isFeatured = true;
    if (filter.size) query.sizes = filter.size;

    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      query.price = {};
      if (filter.minPrice !== undefined) query.price.$gte = filter.minPrice;
      if (filter.maxPrice !== undefined) query.price.$lte = filter.maxPrice;
    }

    if (filter.search) {
      query.$or = [
        { name: { $regex: filter.search, $options: 'i' } },
        { description: { $regex: filter.search, $options: 'i' } },
        { tags: { $regex: filter.search, $options: 'i' } },
      ];
    }

    let sortOption: any = { createdAt: -1 };
    if (filter.sort === 'price_asc') sortOption = { price: 1 };
    if (filter.sort === 'price_desc') sortOption = { price: -1 };
    if (filter.sort === 'rating') sortOption = { rating: -1 };
    if (filter.sort === 'popular') sortOption = { reviewsCount: -1 };

    const limit = filter.limit || 50;

    return this.productModel.find(query).sort(sortOption).limit(limit).lean();
  }

  async getRecommendations(params: RecommendationParams) {
    const query: any = { isActive: true };

    if (params.sportType) query.sportType = { $in: [params.sportType, 'UNIVERSAL'] };
    if (params.usageType) query.usageType = { $in: [params.usageType, 'BOTH'] };

    // Filter by age/size chart
    if (params.age) {
      query.$or = [
        { 'sizeChart.ageMin': { $lte: params.age }, 'sizeChart.ageMax': { $gte: params.age } },
        { sizeChart: { $exists: false } },
      ];
    }

    const products = await this.productModel.find(query).limit(20).lean();

    // Score and sort by relevance
    const scored = products.map((p: any) => {
      let score = 0;
      if (p.isFeatured) score += 10;
      if (p.isNewArrival) score += 5;
      score += p.rating * 2;
      
      // Size match scoring
      if (params.age && p.sizeChart) {
        if (p.sizeChart.ageMin <= params.age && p.sizeChart.ageMax >= params.age) {
          score += 15;
        }
      }

      return { ...p, relevanceScore: score };
    });

    return scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  async getCategories() {
    return {
      categories: [
        { id: 'EQUIPMENT', name: 'Екіпіровка', icon: 'shield-checkmark' },
        { id: 'UNIFORM', name: 'Форма', icon: 'shirt' },
        { id: 'PROTECTION', name: 'Захист', icon: 'fitness' },
        { id: 'ACCESSORIES', name: 'Аксесуари', icon: 'bag-handle' },
        { id: 'NUTRITION', name: 'Харчування', icon: 'nutrition' },
      ],
      sportTypes: [
        { id: 'KARATE', name: 'Карате' },
        { id: 'TAEKWONDO', name: 'Тхеквондо' },
        { id: 'BOXING', name: 'Бокс' },
        { id: 'MMA', name: 'ММА' },
        { id: 'JUDO', name: 'Дзюдо' },
        { id: 'WRESTLING', name: 'Боротьба' },
        { id: 'UNIVERSAL', name: 'Універсальне' },
      ],
      usageTypes: [
        { id: 'TRAINING', name: 'Для тренувань' },
        { id: 'COMPETITION', name: 'Для змагань' },
        { id: 'BOTH', name: 'Універсальне' },
      ],
    };
  }

  async getProductById(id: string) {
    const product = await this.productModel.findById(id).lean();
    if (!product) throw new NotFoundException('Товар не знайдено');
    return product;
  }

  // ========== CART ==========

  async getCart(userId: string) {
    let cart: any = await this.cartModel.findOne({ userId: new Types.ObjectId(userId) }).lean();
    
    if (!cart) {
      const newCart = await this.cartModel.create({
        userId: new Types.ObjectId(userId),
        items: [],
        totalAmount: 0,
      });
      cart = newCart.toObject();
    }

    // Populate product details
    const populatedItems = await Promise.all(
      (cart.items || []).map(async (item: any) => {
        const product = await this.productModel.findById(item.productId).lean();
        return {
          ...item,
          product,
        };
      })
    );

    return { ...cart, items: populatedItems };
  }

  async addToCart(userId: string, data: { productId: string; quantity: number; size?: string; color?: string }) {
    const product = await this.productModel.findById(data.productId);
    if (!product) throw new NotFoundException('Товар не знайдено');
    if (product.stock < data.quantity) throw new BadRequestException('Недостатньо товару на складі');

    let cart = await this.cartModel.findOne({ userId: new Types.ObjectId(userId) });
    
    if (!cart) {
      cart = new this.cartModel({
        userId: new Types.ObjectId(userId),
        items: [],
        totalAmount: 0,
      });
    }

    const existingItemIndex = cart.items.findIndex(
      (item: any) => 
        item.productId.toString() === data.productId &&
        item.size === data.size &&
        item.color === data.color
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += data.quantity;
    } else {
      cart.items.push({
        productId: new Types.ObjectId(data.productId),
        quantity: data.quantity,
        size: data.size,
        color: data.color,
        price: product.price,
      });
    }

    cart.totalAmount = cart.items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );

    await cart.save();
    return this.getCart(userId);
  }

  async updateCartItem(userId: string, data: { productId: string; quantity: number; size?: string; color?: string }) {
    const cart = await this.cartModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!cart) throw new NotFoundException('Кошик не знайдено');

    const itemIndex = cart.items.findIndex(
      (item: any) => 
        item.productId.toString() === data.productId &&
        item.size === data.size &&
        item.color === data.color
    );

    if (itemIndex === -1) throw new NotFoundException('Товар не знайдено в кошику');

    if (data.quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = data.quantity;
    }

    cart.totalAmount = cart.items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );

    await cart.save();
    return this.getCart(userId);
  }

  async removeFromCart(userId: string, productId: string) {
    const cart = await this.cartModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!cart) throw new NotFoundException('Кошик не знайдено');

    cart.items = cart.items.filter((item: any) => item.productId.toString() !== productId);
    cart.totalAmount = cart.items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );

    await cart.save();
    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    await this.cartModel.updateOne(
      { userId: new Types.ObjectId(userId) },
      { $set: { items: [], totalAmount: 0 } }
    );
    return { success: true };
  }

  // ========== ORDERS ==========

  async createOrder(userId: string, data: any) {
    const cart = await this.getCart(userId);
    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Кошик порожній');
    }

    const orderItems = cart.items.map((item: any) => ({
      productId: item.productId,
      name: item.product?.name || 'Товар',
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      price: item.price,
    }));

    const order = await this.orderModel.create({
      userId: new Types.ObjectId(userId),
      items: orderItems,
      totalAmount: cart.totalAmount,
      status: 'PENDING',
      deliveryMethod: data.deliveryMethod || 'PICKUP',
      shippingAddress: data.shippingAddress,
      phone: data.phone,
      comment: data.comment,
      childId: data.childId ? new Types.ObjectId(data.childId) : undefined,
    });

    // Update product stock
    for (const item of cart.items) {
      await this.productModel.updateOne(
        { _id: item.productId },
        { $inc: { stock: -item.quantity } }
      );
    }

    // Clear cart
    await this.clearCart(userId);

    return order;
  }

  async getOrders(userId: string) {
    return this.orderModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean();
  }

  async getOrderById(userId: string, orderId: string) {
    const order = await this.orderModel.findOne({
      _id: new Types.ObjectId(orderId),
      userId: new Types.ObjectId(userId),
    }).lean();

    if (!order) throw new NotFoundException('Замовлення не знайдено');
    return order;
  }

  // ========== ADMIN ==========

  async createProduct(userId: string, data: any) {
    const user = await this.userModel.findById(userId);
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      throw new BadRequestException('Недостатньо прав');
    }

    return this.productModel.create(data);
  }

  async updateProduct(userId: string, productId: string, data: any) {
    const user = await this.userModel.findById(userId);
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      throw new BadRequestException('Недостатньо прав');
    }

    const product = await this.productModel.findByIdAndUpdate(productId, data, { new: true });
    if (!product) throw new NotFoundException('Товар не знайдено');
    return product;
  }

  async deleteProduct(userId: string, productId: string) {
    const user = await this.userModel.findById(userId);
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      throw new BadRequestException('Недостатньо прав');
    }

    await this.productModel.findByIdAndUpdate(productId, { isActive: false });
    return { success: true };
  }
}

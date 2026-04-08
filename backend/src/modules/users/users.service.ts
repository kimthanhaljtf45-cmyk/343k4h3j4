import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  private serialize(user: UserDocument) {
    const obj = user.toObject();
    return {
      id: obj._id.toString(),
      firstName: obj.firstName,
      lastName: obj.lastName,
      username: obj.username,
      phone: obj.phone,
      telegramId: obj.telegramId,
      role: obj.role,
      status: obj.status,
    };
  }

  async findById(id: string) {
    const user = await this.userModel.findById(id);
    return user ? this.serialize(user) : null;
  }

  async findByTelegramId(telegramId: string) {
    const user = await this.userModel.findOne({ telegramId });
    return user ? this.serialize(user) : null;
  }

  async getMe(userId: string) {
    return this.findById(userId);
  }
}

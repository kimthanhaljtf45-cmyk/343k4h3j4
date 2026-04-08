import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../schemas/user.schema';
import { Child, ChildDocument } from '../../schemas/child.schema';
import { Group, GroupDocument } from '../../schemas/group.schema';
import { Location, LocationDocument } from '../../schemas/location.schema';
import { EnrollmentIntent, EnrollmentIntentDocument } from '../../schemas/enrollment-intent.schema';
import { Progress, ProgressDocument } from '../../schemas/progress.schema';

const PROGRAM_MESSAGES = {
  KIDS: 'Формуємо дисципліну, координацію та впевненість з раннього віку',
  SPECIAL: 'Делікатний, уважний і адаптивний формат розвитку',
  ADULT_SELF_DEFENSE: 'Практичні навички самозахисту, впевненість і контроль',
  ADULT_PRIVATE: 'Персональний формат під вашу ціль і ритм',
  CONSULTATION: 'Допоможемо підібрати правильний формат',
};

@Injectable()
export class OnboardingService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Child.name) private childModel: Model<ChildDocument>,
    @InjectModel(Group.name) private groupModel: Model<GroupDocument>,
    @InjectModel(Location.name) private locationModel: Model<LocationDocument>,
    @InjectModel(EnrollmentIntent.name) private enrollmentIntentModel: Model<EnrollmentIntentDocument>,
    @InjectModel(Progress.name) private progressModel: Model<ProgressDocument>,
  ) {}

  private serialize(doc: any) {
    if (!doc) return null;
    const obj = doc.toObject ? doc.toObject() : doc;
    return { ...obj, id: obj._id?.toString(), _id: undefined };
  }

  async selectProgram(userId: string, programType: string) {
    await this.userModel.findByIdAndUpdate(userId, {
      programType,
      onboardingStage: 'program_selected',
    });

    // Create or update enrollment intent
    const user = await this.userModel.findById(userId);
    
    await this.enrollmentIntentModel.findOneAndUpdate(
      { userId },
      {
        userId,
        role: user?.role || 'PARENT',
        programType,
        status: 'NEW',
      },
      { upsert: true, new: true }
    );

    return { success: true, programType };
  }

  async submitOnboarding(
    userId: string,
    data: {
      childName?: string;
      age?: number;
      goal?: string;
      district?: string;
      preferredSchedule?: string[];
      specialNotes?: string;
    }
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new Error('User not found');

    // Update enrollment intent
    await this.enrollmentIntentModel.findOneAndUpdate(
      { userId },
      {
        ...data,
        status: 'REVIEW',
      }
    );

    // Mark user as onboarded
    await this.userModel.findByIdAndUpdate(userId, {
      isOnboarded: true,
      onboardingStage: 'completed',
    });

    // If child info provided and user is parent, create child
    if (data.childName && user.role === 'PARENT') {
      const child = new this.childModel({
        firstName: data.childName,
        age: data.age,
        programType: user.programType || 'KIDS',
      });
      await child.save();

      // Create initial progress
      const progress = new this.progressModel({
        childId: child._id.toString(),
        currentBelt: 'WHITE',
        nextBelt: 'YELLOW',
        progressPercent: 0,
        trainingsToNextBelt: 24,
        trainingsCompleted: 0,
      });
      await progress.save();
    }

    return { success: true, message: 'Дякуємо! Ваша заявка прийнята.' };
  }

  async getRecommendation(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new Error('User not found');

    const programType = user.programType || 'KIDS';
    const intent = await this.enrollmentIntentModel.findOne({ userId });

    // Find matching groups
    const groups = await this.groupModel.find({ programType }).limit(10);
    
    let recommendedGroup = null;
    if (groups.length > 0) {
      // Try to match by district if available
      if (intent?.district) {
        for (const g of groups) {
          if (g.locationId) {
            const location = await this.locationModel.findById(g.locationId);
            if (location && location.district === intent.district) {
              recommendedGroup = this.serialize(g);
              recommendedGroup['location'] = this.serialize(location);
              break;
            }
          }
        }
      }

      if (!recommendedGroup) {
        recommendedGroup = this.serialize(groups[0]);
        if (groups[0].locationId) {
          const location = await this.locationModel.findById(groups[0].locationId);
          if (location) {
            recommendedGroup['location'] = this.serialize(location);
          }
        }
      }
    }

    // Build actions based on program type - FROZEN DOMAIN
    let actions = [];
    if (programType === 'KIDS' || programType === 'SELF_DEFENSE') {
      actions = [
        { type: 'BOOK_TRIAL', title: 'Записатись на пробне' },
        { type: 'OPEN_SCHEDULE', title: 'Переглянути розклад' },
      ];
    } else if (programType === 'SPECIAL') {
      actions = [
        { type: 'REQUEST_CALL', title: 'Залишити заявку на дзвінок' },
        { type: 'CONTACT', title: 'Написати нам' },
      ];
    } else {
      actions = [
        { type: 'REQUEST_CALL', title: 'Замовити консультацію' },
        { type: 'VIEW_PROGRAMS', title: 'Переглянути програми' },
      ];
    }

    return {
      programType,
      recommendedGroup,
      actions,
      message: PROGRAM_MESSAGES[programType] || '',
    };
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Group, GroupDocument } from '../../schemas/group.schema';
import { Child, ChildDocument } from '../../schemas/child.schema';
import {
  CoachProfile,
  CoachProfileDocument,
} from '../../schemas/coach-profile.schema';
import { Club, ClubDocument } from '../../schemas/club.schema';
import { User, UserDocument } from '../../schemas/user.schema';

import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AssignCoachDto } from './dto/assign-coach.dto';
import { AssignStudentsDto } from './dto/assign-students.dto';

@Injectable()
export class AdminGroupsService {
  constructor(
    @InjectModel(Group.name)
    private readonly groupModel: Model<GroupDocument>,

    @InjectModel(Child.name)
    private readonly childModel: Model<ChildDocument>,

    @InjectModel(CoachProfile.name)
    private readonly coachProfileModel: Model<CoachProfileDocument>,

    @InjectModel(Club.name)
    private readonly clubModel: Model<ClubDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  private serialize(doc: any) {
    if (!doc) return null;
    const obj = doc.toObject ? doc.toObject() : doc;
    return { ...obj, id: obj._id?.toString(), _id: undefined };
  }

  async create(dto: CreateGroupDto) {
    // Verify club exists
    const club = await this.clubModel.findById(dto.clubId);
    if (!club) throw new BadRequestException('Club not found');

    // Verify coach exists
    const coach = await this.userModel.findOne({ _id: dto.coachId, role: 'COACH' });
    if (!coach) throw new BadRequestException('Coach not found');

    // Create or update coach profile
    let coachProfile = await this.coachProfileModel.findOne({ userId: dto.coachId });
    if (!coachProfile) {
      coachProfile = await this.coachProfileModel.create({
        userId: dto.coachId,
        clubIds: [dto.clubId],
        groupIds: [],
      });
    }

    const group = await this.groupModel.create(dto);

    // Update coach profile with new group
    await this.coachProfileModel.updateOne(
      { userId: dto.coachId },
      {
        $addToSet: {
          groupIds: group._id.toString(),
          clubIds: dto.clubId,
        },
      },
    );

    return this.serialize(group);
  }

  async findAll(filters?: { clubId?: string; coachId?: string; isActive?: string }): Promise<any[]> {
    const query: any = {};

    if (filters?.clubId) query.clubId = filters.clubId;
    if (filters?.coachId) query.coachId = filters.coachId;
    if (filters?.isActive !== undefined) query.isActive = filters.isActive === 'true';

    const groups = await this.groupModel.find(query).sort({ createdAt: -1 }).lean();

    const ids = groups.map((g) => g._id.toString());
    const students = await this.childModel.find({ groupId: { $in: ids }, isActive: true }).lean();

    // Get coach info
    const coachIds = [...new Set(groups.map(g => g.coachId))];
    const coaches = await this.userModel.find({ _id: { $in: coachIds } }).lean();
    const coachMap = new Map(coaches.map(c => [c._id.toString(), c]));

    return groups.map((group) => {
      const coach = coachMap.get(group.coachId);
      return {
        ...group,
        id: group._id.toString(),
        studentsCount: students.filter((s) => s.groupId === group._id.toString()).length,
        coach: coach ? { id: coach._id.toString(), firstName: coach.firstName, lastName: coach.lastName } : null,
      };
    });
  }

  async findById(id: string): Promise<any> {
    const group = await this.groupModel.findById(id).lean();
    if (!group) throw new NotFoundException('Group not found');

    const students = await this.childModel.find({ groupId: id, isActive: true }).lean();
    const coach = await this.userModel.findById(group.coachId).lean();
    const club = await this.clubModel.findById(group.clubId).lean();

    return {
      ...group,
      id: group._id.toString(),
      students: students.map(s => ({ ...s, id: s._id.toString() })),
      studentsCount: students.length,
      coach: coach ? { id: coach._id.toString(), firstName: coach.firstName, lastName: coach.lastName, phone: coach.phone } : null,
      club: club ? { id: club._id.toString(), name: club.name, address: club.address } : null,
    };
  }

  async update(id: string, dto: UpdateGroupDto): Promise<any> {
    const group = await this.groupModel.findById(id);
    if (!group) throw new NotFoundException('Group not found');

    const oldCoachId = group.coachId;
    const oldClubId = group.clubId;

    Object.assign(group, dto);
    await group.save();

    // If coach changed, update profiles and children
    if (dto.coachId && dto.coachId !== oldCoachId) {
      // Remove from old coach
      await this.coachProfileModel.updateOne(
        { userId: oldCoachId },
        { $pull: { groupIds: id } },
      );

      // Add to new coach
      await this.coachProfileModel.updateOne(
        { userId: dto.coachId },
        { $addToSet: { groupIds: id, clubIds: group.clubId } },
      );

      // Update all children in this group
      await this.childModel.updateMany(
        { groupId: id },
        { $set: { coachId: dto.coachId } },
      );
    }

    // If club changed, update children
    if (dto.clubId && dto.clubId !== oldClubId) {
      await this.childModel.updateMany(
        { groupId: id },
        { $set: { clubId: dto.clubId } },
      );
    }

    return this.findById(id);
  }

  async assignCoach(id: string, dto: AssignCoachDto): Promise<any> {
    const group = await this.groupModel.findById(id);
    if (!group) throw new NotFoundException('Group not found');

    const coach = await this.userModel.findOne({ _id: dto.coachId, role: 'COACH' });
    if (!coach) throw new BadRequestException('Coach not found');

    // Ensure coach profile exists
    let coachProfile = await this.coachProfileModel.findOne({ userId: dto.coachId });
    if (!coachProfile) {
      coachProfile = await this.coachProfileModel.create({
        userId: dto.coachId,
        clubIds: [group.clubId],
        groupIds: [],
      });
    }

    const prevCoachId = group.coachId;
    group.coachId = dto.coachId;
    await group.save();

    // Update old coach profile
    if (prevCoachId) {
      await this.coachProfileModel.updateOne(
        { userId: prevCoachId },
        { $pull: { groupIds: id } },
      );
    }

    // Update new coach profile
    await this.coachProfileModel.updateOne(
      { userId: dto.coachId },
      {
        $addToSet: {
          groupIds: id,
          clubIds: group.clubId,
        },
      },
    );

    // Update all children in this group
    await this.childModel.updateMany(
      { groupId: id },
      { $set: { coachId: dto.coachId } },
    );

    return this.findById(id);
  }

  async assignStudents(id: string, dto: AssignStudentsDto): Promise<any> {
    const group = await this.groupModel.findById(id);
    if (!group) throw new NotFoundException('Group not found');

    const children = await this.childModel.find({
      _id: { $in: dto.childIds },
    });

    if (!children.length) {
      throw new BadRequestException('No children found for assignment');
    }

    // Update each child with group, coach, club, and program info
    for (const child of children) {
      child.groupId = id;
      child.coachId = group.coachId;
      child.clubId = group.clubId;
      child.programType = group.programType as any;
      await child.save();
    }

    return this.findById(id);
  }

  async removeStudentFromGroup(groupId: string, childId: string) {
    const group = await this.groupModel.findById(groupId);
    if (!group) throw new NotFoundException('Group not found');

    const child = await this.childModel.findById(childId);
    if (!child) throw new NotFoundException('Child not found');

    // Clear group assignment but keep other data
    child.groupId = '';
    await child.save();

    return { success: true };
  }

  async remove(id: string) {
    const group = await this.groupModel.findById(id);
    if (!group) throw new NotFoundException('Group not found');

    // Update coach profile
    await this.coachProfileModel.updateOne(
      { userId: group.coachId },
      { $pull: { groupIds: id } },
    );

    // Clear group assignment from children
    await this.childModel.updateMany(
      { groupId: id },
      { $set: { groupId: '' } },
    );

    await this.groupModel.deleteOne({ _id: id });

    return { success: true };
  }
}

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  GroupMember,
  GroupMemberRole,
  JoinedBy,
  MembershipStatus,
} from './entities/group_member.entity';

import { AddGroupMemberDto } from './dto/add-group-member.dto';

@Injectable()
export class GroupMembersService {
  constructor(
    @InjectRepository(GroupMember)
    private readonly groupMembersRepository: Repository<GroupMember>,
  ) {}

  async findMembersByGroup(groupId: string) {
    return this.groupMembersRepository.find({
      where: {
        groupId,
        membershipStatus: MembershipStatus.ACTIVE,
      },
      relations: {
        user: true,
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  async findMembership(groupId: string, userId: string) {
    return this.groupMembersRepository.findOne({
      where: {
        groupId,
        userId,
      },
    });
  }

  async addMember(
    groupId: string,
    requesterId: string,
    dto: AddGroupMemberDto,
  ) {
    const requesterMembership = await this.findMembership(
      groupId,
      requesterId,
    );

    if (
      !requesterMembership ||
      requesterMembership.membershipStatus !== MembershipStatus.ACTIVE
    ) {
      throw new ForbiddenException(
        'You are not an active member of this group',
      );
    }

    if (
      requesterMembership.role !== GroupMemberRole.OWNER &&
      requesterMembership.role !== GroupMemberRole.ADMIN
    ) {
      throw new ForbiddenException(
        'You do not have permission to add members',
      );
    }

    if (dto.role === GroupMemberRole.OWNER) {
      throw new BadRequestException(
        'The owner role cannot be assigned directly',
      );
    }

    const existingMembership = await this.findMembership(
      groupId,
      dto.userId,
    );

    if (existingMembership) {
      throw new ConflictException(
        'The user already belongs to this group',
      );
    }

    const member = this.groupMembersRepository.create({
      groupId,
      userId: dto.userId,
      role: dto.role ?? GroupMemberRole.MEMBER,
      membershipStatus: MembershipStatus.ACTIVE,
      joinedBy: JoinedBy.DIRECT_INVITATION,
      joinedAt: new Date(),
    });

    return this.groupMembersRepository.save(member);
  }async updateMemberRole(
    groupId: string,
    memberUserId: string,
    requesterId: string,
    role: GroupMemberRole,
  ) {
    const requesterMembership = await this.findMembership(
      groupId,
      requesterId,
    );

    if (!requesterMembership) {
      throw new ForbiddenException(
        'You do not belong to this group',
      );
    }

    if (requesterMembership.role !== GroupMemberRole.OWNER) {
      throw new ForbiddenException(
        'Only the group owner can change member roles',
      );
    }

    if (role === GroupMemberRole.OWNER) {
      throw new BadRequestException(
        'Ownership cannot be assigned through this operation',
      );
    }

    const member = await this.findMembership(
      groupId,
      memberUserId,
    );

    if (!member) {
      throw new NotFoundException(
        'Group member not found',
      );
    }

    if (member.role === GroupMemberRole.OWNER) {
      throw new BadRequestException(
        'The owner role cannot be modified',
      );
    }

    member.role = role;

    return this.groupMembersRepository.save(member);
  }

 async removeMember(
    groupId: string,
    memberUserId: string,
    requesterId: string,
  ) {
    const requesterMembership = await this.findMembership(
      groupId,
      requesterId,
    );

    if (!requesterMembership) {
      throw new ForbiddenException(
        'You do not belong to this group',
      );
    }

    if (
      requesterMembership.role !== GroupMemberRole.OWNER &&
      requesterMembership.role !== GroupMemberRole.ADMIN
    ) {
      throw new ForbiddenException(
        'You do not have permission to remove members',
      );
    }

    const member = await this.findMembership(
      groupId,
      memberUserId,
    );

    if (!member) {
      throw new NotFoundException(
        'Group member not found',
      );
    }

    if (member.role === GroupMemberRole.OWNER) {
      throw new BadRequestException(
        'The group owner cannot be removed',
      );
    }

    if (
      requesterMembership.role === GroupMemberRole.ADMIN &&
      member.role === GroupMemberRole.ADMIN
    ) {
      throw new ForbiddenException(
        'An admin cannot remove another admin',
      );
    }

    member.membershipStatus = MembershipStatus.REMOVED;

    return this.groupMembersRepository.save(member);
  }
  async leaveGroup(
    groupId: string,
    userId: string,
  ) {
    const membership = await this.findMembership(
      groupId,
      userId,
    );

    if (!membership) {
      throw new NotFoundException(
        'You do not belong to this group',
      );
    }

    if (membership.role === GroupMemberRole.OWNER) {
      throw new BadRequestException(
        'The group owner cannot leave the group',
      );
    }

    membership.membershipStatus =
      MembershipStatus.LEFT;

    return this.groupMembersRepository.save(
      membership,
    );
  }
}
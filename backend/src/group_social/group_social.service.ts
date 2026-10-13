
 // backend/src/group_social/group_social.service.ts

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Group, GroupStatus } from '../groups/entities/group.entity';

import {
  GroupMember,
  MembershipStatus,
} from '../group_members/entities/group_member.entity';

import { User, UserRole } from '../users/entities/user.entity';

import {
  Wishlist,
  WishlistStatus,
  WishlistVisibility,
} from '../wishlists/entities/wishlist.entity';

import { WishlistItem } from '../wishlist_items/entities/wishlist_item.entity';

@Injectable()
export class GroupSocialService {
  constructor(
    @InjectRepository(Group)
    private readonly groupsRepository: Repository<Group>,

    @InjectRepository(GroupMember)
    private readonly membersRepository: Repository<GroupMember>,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @InjectRepository(Wishlist)
    private readonly wishlistsRepository: Repository<Wishlist>,

    @InjectRepository(WishlistItem)
    private readonly itemsRepository: Repository<WishlistItem>,
  ) {}

  async getMemberProfile(
    groupId: string,
    memberId: string,
    requesterId: string,
  ) {
    const group = await this.groupsRepository.findOne({
      where: { id: groupId, status: GroupStatus.ACTIVE },
    });

    if (!group) {
      throw new NotFoundException('Grupo no encontrado.');
    }

    const requester = await this.usersRepository.findOne({
      where: { id: requesterId, status: 'active' },
    });

    if (!requester) {
      throw new ForbiddenException('Cuenta no disponible.');
    }

    const membership = await this.membersRepository.findOne({
      where: {
        groupId,
        userId: requesterId,
        membershipStatus: MembershipStatus.ACTIVE,
      },
    });

    const canView =
      group.ownerId === requesterId ||
      requester.role === UserRole.ADMIN ||
      Boolean(membership);

    if (!canView) {
      throw new ForbiddenException(
        'Debes pertenecer al grupo para ver los perfiles.',
      );
    }

    const member = await this.membersRepository.findOne({
      where: {
        id: memberId,
        groupId,
        membershipStatus: MembershipStatus.ACTIVE,
      },
      relations: { user: true },
    });

    if (!member) {
      throw new NotFoundException(
        'Este integrante no pertenece al grupo.',
      );
    }

    // Invitado que participa sin cuenta.
    if (!member.userId) {
      return {
        memberId: member.id,
        groupId,
        userId: null,
        isGuest: true,
        name: member.guestName || 'Invitado',
        username: null,
        avatarUrl: member.guestAvatarUrl,
        role: member.role,
        wishlists: [
          {
            id: member.id,
            name: 'Lista de deseos',
            items: (member.guestWishlist || []).map(
              (wish, index) => ({
                id: `${member.id}-${index}`,
                name: wish.name,
                description: wish.note || null,
                productUrl: wish.productUrl || null,
                imageUrl: null,
                estimatedPrice: null,
              }),
            ),
          },
        ],
      };
    }

    const person = member.user;

    if (!person || person.status !== 'active') {
      throw new NotFoundException('Usuario no disponible.');
    }

    // No se incluyen listas privadas ni archivadas.
    const lists = await this.wishlistsRepository.find({
      where: {
        userId: person.id,
        status: WishlistStatus.ACTIVE,
        visibility: In([
          WishlistVisibility.GROUPS,
          WishlistVisibility.PUBLIC,
        ]),
      },
      order: {
        isDefault: 'DESC',
        createdAt: 'DESC',
      },
    });

    const ids = lists.map((list) => list.id);

    const items = ids.length
      ? await this.itemsRepository.find({
          where: { wishlistId: In(ids), isReceived: false },
          order: { createdAt: 'DESC' },
        })
      : [];

    const name = [
      person.firstName,
      person.lastName,
    ].filter(Boolean).join(' ').trim() || person.username;

    return {
      memberId: member.id,
      groupId,
      userId: person.id,
      isGuest: false,
      name,
      username: person.username,
      avatarUrl: person.avatarUrl,
      role: member.role,

      wishlists: lists.map((list) => ({
        id: list.id,
        name: list.name,
        items: items
          .filter((item) => item.wishlistId === list.id)
          .map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            productUrl: item.productUrl,
            imageUrl: item.imageUrl,
            estimatedPrice: item.estimatedPrice,
          })),
      })),
    };
  }
}

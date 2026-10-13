import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { randomBytes, createHash } from 'node:crypto';
import { Group, GroupJoinMode, GroupStatus } from '../groups/entities/group.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { IMAGE_FOLDERS } from '../cloudinary/cloudinary.constants';

import {
  GroupMember,
  GroupMemberRole,
  JoinedBy,
  MembershipStatus,
} from './entities/group_member.entity';

import { AddGroupMemberDto } from './dto/add-group-member.dto';



import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { RegisterDto } from '../auth/dto/register.dto';
import { Wishlist, WishlistVisibility } from '../wishlists/entities/wishlist.entity';
import { WishlistItem } from '../wishlist_items/entities/wishlist_item.entity';

@Injectable()
export class GroupMembersService {
  private readonly logger = new Logger(GroupMembersService.name);
  constructor(
    @InjectRepository(GroupMember)
    private readonly groupMembersRepository: Repository<GroupMember>,
    @InjectRepository(Group) private readonly groupsRepository: Repository<Group>,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly cloudinaryService: CloudinaryService,
    
private readonly dataSource: DataSource,
private readonly jwtService: JwtService,

  ) {}

async registerGuest(
  token: string,
  dto: RegisterDto,
) {
  // Verifica que el invitado esté activo.
  const guest = await this.getGuestEntityByToken(token);

  const username = dto.username.trim();
  const email = dto.email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(dto.password, 10);

  let registered: User;

  try {
    registered = await this.dataSource.transaction(
      async (manager) => {
        const members = manager.getRepository(GroupMember);
        const users = manager.getRepository(User);

        // Bloqueamos la membresía para impedir
        // que el mismo token se utilice dos veces.
        const member = await members
          .createQueryBuilder('member')
          .addSelect('member.guestAccessHash')
          .where('member.id = :id', { id: guest.id })
          .setLock('pessimistic_write')
          .getOne();

        if (
          !member ||
          member.userId ||
          member.membershipStatus !== MembershipStatus.ACTIVE ||
          member.guestAccessHash !== this.hash(token)
        ) {
          throw new UnauthorizedException(
            'El acceso de invitado ya no es válido.',
          );
        }

        const existing = await users.findOne({
          where: [
            { username },
            { email },
          ],
        });

        if (existing) {
          throw new ConflictException(
            'El nombre de usuario o correo ya está registrado.',
          );
        }

        // La nueva cuenta hereda el avatar del invitado.
        const account = await users.save(
          users.create({
            username,
            email,
            passwordHash,
            role: UserRole.CLIENT,
            firstName:
              dto.firstName?.trim() ||
              member.guestName ||
              null,
            lastName: dto.lastName?.trim() || null,
            avatarUrl: member.guestAvatarUrl,
            avatarPublicId: member.guestAvatarPublicId,
          }),
        );

        // Conservamos la misma membresía y su UUID.
        const previousWishes = member.guestWishlist ?? [];

        member.userId = account.id;
        member.guestName = null;
        member.guestAccessHash = null;
        member.guestAvatarUrl = null;
        member.guestAvatarPublicId = null;
        member.guestWishlist = [];

        await members.save(member);

        // Creamos la lista predeterminada del nuevo usuario.
        const lists = manager.getRepository(Wishlist);

        const list = await lists.save(
          lists.create({
            userId: account.id,
            name: 'Mi lista de deseos',
            description: null,
            visibility: WishlistVisibility.GROUPS,
            isDefault: true,
          }),
        );

        // Migramos los deseos que añadió como invitado.
        if (previousWishes.length > 0) {
          const items = manager.getRepository(WishlistItem);

          await items.save(
            previousWishes.map((wish) =>
              items.create({
                wishlistId: list.id,
                name: wish.name.slice(0, 150),
                description: wish.note?.slice(0, 700) || null,
                productUrl: wish.productUrl || null,
                imageUrl: null,
                imagePublicId: null,
                estimatedPrice: null,
                currencyCode: 'BOB',
                quantity: 1,
                isReceived: false,
              }),
            ),
          );
        }

        return account;
      },
    );
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    ) {
      throw new ConflictException(
        'El correo o nombre de usuario ya existe.',
      );
    }

    throw error;
  }

  const accessToken = await this.jwtService.signAsync({
    sub: registered.id,
    email: registered.email,
    username: registered.username,
    role: registered.role,
  });

  // No devolvemos el hash de contraseña
  // ni los identificadores internos de Cloudinary.
  return {
    accessToken,
    groupId: guest.groupId,
    user: {
      id: registered.id,
      username: registered.username,
      email: registered.email,
      role: registered.role,
      firstName: registered.firstName,
      lastName: registered.lastName,
      phone: registered.phone,
      avatarUrl: registered.avatarUrl,
      biography: registered.biography,
      birthDate: registered.birthDate,
      timezone: registered.timezone,
      languageCode: registered.languageCode,
      status: registered.status,
      emailVerifiedAt: registered.emailVerifiedAt,
      lastLoginAt: registered.lastLoginAt,
      createdAt: registered.createdAt,
      updatedAt: registered.updatedAt,
    },
  };
}

  async findMembersByGroup(groupId: string, requesterId: string) {
    const group = await this.getActiveGroup(groupId);
    const actor = await this.usersRepository.findOne({ where: { id: requesterId, status: 'active' } });
    if (group.ownerId !== requesterId && actor?.role !== UserRole.ADMIN) {
      const requester = await this.findMembership(groupId, requesterId);
      if (!requester || requester.membershipStatus !== MembershipStatus.ACTIVE) throw new ForbiddenException('No perteneces al grupo.');
    }
    const members = await this.groupMembersRepository.find({
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
    return members.map(m => ({ id: m.id, groupId: m.groupId, role: m.role, membershipStatus: m.membershipStatus,
      isGuest: !m.userId, guestName: m.guestName, guestAvatarUrl: m.guestAvatarUrl, guestWishlist: m.guestWishlist,
      user: m.user ? { id: m.user.id, username: m.user.username, firstName: m.user.firstName,
        lastName: m.user.lastName, avatarUrl: m.user.avatarUrl } : null }));
  }

  private hash(token: string): string { return createHash('sha256').update(token).digest('hex'); }

  private async getActiveGroup(id: string): Promise<Group> {
    const group = await this.groupsRepository.findOne({ where: { id } });
    if (!group || group.status !== GroupStatus.ACTIVE) throw new NotFoundException('Grupo no disponible.');
    return group;
  }

  private async validateInvitation(code: string): Promise<Group> {
    const group = await this.groupsRepository.findOne({ where: { invitationCode: code } });
    if (!group || group.status !== GroupStatus.ACTIVE || !group.invitationEnabled ||
        (group.invitationExpiresAt && group.invitationExpiresAt < new Date())) {
      throw new NotFoundException('Invitación no disponible.');
    }
    if (group.joinMode === GroupJoinMode.CLOSED) throw new ForbiddenException('Este grupo no acepta invitaciones.');
    return group;
  }

  private async checkCapacity(group: Group) {
    if (group.maximumMembers === null) return;
    const total = await this.groupMembersRepository.count({
      where: [{ groupId: group.id, membershipStatus: MembershipStatus.ACTIVE },
              { groupId: group.id, membershipStatus: MembershipStatus.PENDING }],
    });
    if (total >= group.maximumMembers) throw new ConflictException('El grupo alcanzó su capacidad.');
  }

  private async assertModerator(groupId: string, requesterId: string) {
    const group = await this.getActiveGroup(groupId);
    const actor = await this.usersRepository.findOne({ where: { id: requesterId, status: 'active' } });
    if (!actor) throw new ForbiddenException('Tu cuenta no está activa.');
    if (group.ownerId === requesterId || actor.role === UserRole.ADMIN) return group;
    const member = await this.findMembership(groupId, requesterId);
    if (!member || member.membershipStatus !== MembershipStatus.ACTIVE ||
        ![GroupMemberRole.ADMIN, GroupMemberRole.OWNER].includes(member.role)) {
      throw new ForbiddenException('Se requieren permisos de administrador del grupo.');
    }
    return group;
  }

  private async createGuest(group: Group, guestName: string, pending: boolean) {
    await this.checkCapacity(group);
    const name = guestName.trim();
    if (name.length < 2) throw new BadRequestException('Nombre demasiado corto.');
    const token = randomBytes(32).toString('hex');
    const entity = this.groupMembersRepository.create({
      groupId: group.id, userId: null, guestName: name, guestAccessHash: this.hash(token),
      role: GroupMemberRole.MEMBER, guestWishlist: [],
      membershipStatus: pending ? MembershipStatus.PENDING : MembershipStatus.ACTIVE,
      joinedBy: JoinedBy.INVITATION_LINK, joinedAt: pending ? null : new Date(),
    });
    const saved = await this.groupMembersRepository.save(entity);
    return { memberId: saved.id, groupId: saved.groupId, name, status: saved.membershipStatus, guestToken: token,
      message: 'Guarda este token: permite consultar tu amigo secreto sin cuenta.' };
  }

  async joinGuest(code: string, guestName: string) {
    const group = await this.validateInvitation(code);
    return this.createGuest(group, guestName, group.joinMode === GroupJoinMode.APPROVAL);
  }

  async addGuestByModerator(groupId: string, requesterId: string, guestName: string) {
    const group = await this.assertModerator(groupId, requesterId);
    return this.createGuest(group, guestName, false);
  }

  async joinRegistered(code: string, userId: string) {
    const group = await this.validateInvitation(code);
    const user = await this.usersRepository.findOne({ where: { id: userId, status: 'active' } });
    if (!user) throw new ForbiddenException('Tu usuario no está activo.');
    const existing = await this.findMembership(group.id, userId);
    if (existing?.membershipStatus === MembershipStatus.ACTIVE || existing?.membershipStatus === MembershipStatus.PENDING) {
      throw new ConflictException('Ya perteneces al grupo o tienes solicitud pendiente.');
    }
    await this.checkCapacity(group);
    const pending = group.joinMode === GroupJoinMode.APPROVAL;
    const membership = existing ?? this.groupMembersRepository.create({ groupId: group.id, userId });
    membership.role = GroupMemberRole.MEMBER;
    membership.membershipStatus = pending ? MembershipStatus.PENDING : MembershipStatus.ACTIVE;
    membership.joinedBy = JoinedBy.INVITATION_LINK;
    membership.joinedAt = pending ? null : new Date();
    return this.groupMembersRepository.save(membership);
  }

  async getGuestEntityByToken(token: string, requireActive = true): Promise<GroupMember> {
    if (!token || !/^[a-f0-9]{64}$/.test(token)) throw new UnauthorizedException('Acceso de invitado inválido.');
    const guest = await this.groupMembersRepository.createQueryBuilder('member')
      .addSelect('member.guestAccessHash')
      .where('member.guestAccessHash = :hash', { hash: this.hash(token) })
      .getOne();
    if (!guest || guest.userId || ![MembershipStatus.ACTIVE, MembershipStatus.PENDING].includes(guest.membershipStatus) ||
        (requireActive && guest.membershipStatus !== MembershipStatus.ACTIVE)) {
      throw new UnauthorizedException('Acceso de invitado no disponible.');
    }
    await this.getActiveGroup(guest.groupId);
    return guest;
  }

  
async getGuestByToken(token: string) {
  const guest = await this.getGuestEntityByToken(token, false);

  const group = await this.getActiveGroup(guest.groupId);

  const members =
    guest.membershipStatus === MembershipStatus.ACTIVE
      ? await this.groupMembersRepository.find({
          where: {
            groupId: guest.groupId,
            membershipStatus: MembershipStatus.ACTIVE,
          },
          relations: {
            user: true,
          },
          order: {
            createdAt: 'ASC',
          },
        })
      : [];

  return {
    memberId: guest.id,
    groupId: guest.groupId,
    name: guest.guestName,
    status: guest.membershipStatus,
    avatarUrl: guest.guestAvatarUrl,
    wishlist: guest.guestWishlist,

    group: {
      id: group.id,
      name: group.name,
      description: group.description,
      imageUrl: group.imageUrl,
    },

    members: members.map((member) => ({
      id: member.id,
      name: member.userId
        ? (
            [
              member.user?.firstName,
              member.user?.lastName,
            ].filter(Boolean).join(' ').trim() ||
            member.user?.username ||
            'Usuario'
          )
        : member.guestName || 'Invitado',
      avatarUrl: member.userId
        ? member.user?.avatarUrl ?? null
        : member.guestAvatarUrl,
      isGuest: !member.userId,
      role: member.role,
    })),
  };
}


  async updateGuestWishlist(token: string, items: Array<{name: string; productUrl?: string; note?: string}>) {
    const guest = await this.getGuestEntityByToken(token, false);
    guest.guestWishlist = items;
    await this.groupMembersRepository.save(guest);
    return this.getGuestByToken(token);
  }

  async updateGuestAvatar(token: string, file: Express.Multer.File | undefined) {
    const guest = await this.getGuestEntityByToken(token, false);
    const uploaded = await this.cloudinaryService.uploadImage(file, IMAGE_FOLDERS.GUESTS);
    let previous: string | null = null;
    try {
      await this.groupMembersRepository.manager.transaction(async manager => {
        const repo = manager.getRepository(GroupMember);
        const member = await repo.createQueryBuilder('member').addSelect('member.guestAccessHash')
          .where('member.id = :id', { id: guest.id }).setLock('pessimistic_write').getOne();
        if (!member || member.guestAccessHash !== this.hash(token)) throw new UnauthorizedException('Invitado inválido.');
        previous = member.guestAvatarPublicId;
        member.guestAvatarUrl = uploaded.url;
        member.guestAvatarPublicId = uploaded.publicId;
        await repo.save(member);
      });
    } catch (error) { await this.cleanupAvatar(uploaded.publicId); throw error; }
    await this.cleanupAvatar(previous);
    return this.getGuestByToken(token);
  }

  private async cleanupAvatar(publicId: string | null) {
    if (!publicId) return;
    try { await this.cloudinaryService.deleteImage(publicId); }
    catch { this.logger.warn(`Limpieza pendiente en Cloudinary: ${publicId}`); }
  }

  async approveGuest(groupId: string, guestId: string, requesterId: string) {
    await this.assertModerator(groupId, requesterId);
    const guest = await this.groupMembersRepository.findOne({ where: { id: guestId, groupId, userId: IsNull() } });
    if (!guest || guest.membershipStatus !== MembershipStatus.PENDING) throw new NotFoundException('Invitado pendiente no encontrado.');
    guest.membershipStatus = MembershipStatus.ACTIVE; guest.joinedAt = new Date();
    await this.groupMembersRepository.save(guest);
    return { memberId: guest.id, status: guest.membershipStatus };
  }

  async removeGuest(groupId: string, guestId: string, requesterId: string) {
    await this.assertModerator(groupId, requesterId);
    const guest = await this.groupMembersRepository.findOne({ where: { id: guestId, groupId, userId: IsNull() } });
    if (!guest) throw new NotFoundException('Invitado no encontrado.');
    const oldImage = guest.guestAvatarPublicId;
    guest.membershipStatus = MembershipStatus.REMOVED; guest.guestAccessHash = null;
    guest.guestAvatarUrl = null; guest.guestAvatarPublicId = null;
    await this.groupMembersRepository.save(guest);
    await this.cleanupAvatar(oldImage);
    return { message: 'Invitado eliminado.' };
  }

  async findPending(groupId: string, requesterId: string) {
    await this.assertModerator(groupId, requesterId);
    const members = await this.groupMembersRepository.find({
      where: { groupId, membershipStatus: MembershipStatus.PENDING }, relations: { user: true },
    });
    return members.map(m => ({ memberId: m.id, guestName: m.guestName, isGuest: !m.userId,
      userId: m.userId, username: m.user?.username ?? null }));
  }

  async approveMember(groupId: string, memberUserId: string, requesterId: string) {
    await this.assertModerator(groupId, requesterId);
    const membership = await this.findMembership(groupId, memberUserId);
    if (!membership || membership.membershipStatus !== MembershipStatus.PENDING) throw new NotFoundException('Solicitud pendiente no encontrada.');
    membership.membershipStatus = MembershipStatus.ACTIVE;
    membership.joinedAt = new Date();
    return this.groupMembersRepository.save(membership);
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
    await this.assertModerator(groupId, requesterId);

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

    const group = await this.getActiveGroup(groupId);
    await this.checkCapacity(group);
    const targetUser = await this.usersRepository.findOne({ where: { id: dto.userId, status: 'active' } });
    if (!targetUser) throw new NotFoundException('El usuario no existe o está inactivo.');
    const member = this.groupMembersRepository.create({
      groupId,
      userId: dto.userId,
      role: dto.role ?? GroupMemberRole.MEMBER,
      membershipStatus: MembershipStatus.ACTIVE,
      joinedBy: JoinedBy.DIRECT_INVITATION,
      joinedAt: new Date(),
    });

    return this.groupMembersRepository.save(member);
  }

  async updateMemberRole(
    groupId: string,
    memberUserId: string,
    requesterId: string,
    role: GroupMemberRole,
  ) {
    const requesterMembership = await this.findMembership(
      groupId,
      requesterId,
    );

    const actor = await this.usersRepository.findOne({ where: { id: requesterId, status: 'active' } });
    if (!requesterMembership && actor?.role !== UserRole.ADMIN) {
      throw new ForbiddenException('No perteneces a este grupo.');
    }
    await this.getActiveGroup(groupId);
    if ((requesterMembership?.membershipStatus !== MembershipStatus.ACTIVE ||
         requesterMembership.role !== GroupMemberRole.OWNER) && actor?.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo el dueño o el administrador de la plataforma puede cambiar roles.');
    }
    if (!Object.values(GroupMemberRole).includes(role)) {
      throw new BadRequestException('El rol del grupo no es válido.');
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

    const actor = await this.usersRepository.findOne({ where: { id: requesterId, status: 'active' } });
    if (!requesterMembership && actor?.role !== UserRole.ADMIN) {
      throw new ForbiddenException('No perteneces a este grupo.');
    }
    await this.getActiveGroup(groupId);
    if ((!requesterMembership || requesterMembership.membershipStatus !== MembershipStatus.ACTIVE ||
        ![GroupMemberRole.OWNER, GroupMemberRole.ADMIN].includes(requesterMembership.role)) &&
        actor?.role !== UserRole.ADMIN) {
      throw new ForbiddenException('No tienes permiso para expulsar miembros.');
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
      requesterMembership?.role === GroupMemberRole.ADMIN &&
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
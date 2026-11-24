import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Group } from '../groups/entities/group.entity';

@Entity('friendships') @Index(['userA','userB'], { unique: true })
export class Friendship {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') userA: string;
  @Column('uuid') userB: string;
  @Column('uuid') requesterId: string;
  @Column({length:12,default:'pending'}) status: 'pending'|'accepted';
  @CreateDateColumn({type:'timestamptz'}) createdAt: Date;
  @ManyToOne(()=>User,{onDelete:'CASCADE'}) @JoinColumn({name:'userA'}) first: User;
  @ManyToOne(()=>User,{onDelete:'CASCADE'}) @JoinColumn({name:'userB'}) second: User;
}
@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index({unique:true}) @Column('uuid') ownerId: string;
  @ManyToOne(()=>User,{onDelete:'RESTRICT'}) @JoinColumn({name:'ownerId'}) owner: User;
  @Column({length:120}) name: string;
  @Column({length:30,default:''}) nit: string;
  @Column({length:1000,default:''}) description: string;
  @Column({length:500,default:''}) address: string;
  @Column({length:500,default:''}) facebookUrl: string;
  @Column({length:500,default:''}) tiktokUrl: string;
  @Column({length:15}) whatsapp: string;
  @Column({type:'text',nullable:true}) logoUrl: string|null;
  @Column({type:'text',nullable:true,select:false}) logoPublicId: string|null;
  @Column({type:'text',nullable:true}) qrImageUrl: string|null;
  @Column({type:'text',nullable:true,select:false}) qrPublicId: string|null;
  @Column({default:true}) active: boolean;
  @CreateDateColumn({type:'timestamptz'}) createdAt: Date;
}
@Entity('store_categories') @Index(['storeId','name'],{unique:true})
export class StoreCategory {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') storeId: string;
  @ManyToOne(()=>Store,{onDelete:'RESTRICT'}) @JoinColumn({name:'storeId'}) store: Store;
  @Column({length:100}) name: string;
  @Column({default:true}) active: boolean;
}
@Entity('store_products')
export class StoreProduct {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column('uuid') storeId: string;
  @ManyToOne(()=>Store,{onDelete:'RESTRICT'}) @JoinColumn({name:'storeId'}) store: Store;
  @Column('uuid') categoryId: string;
  @ManyToOne(()=>StoreCategory,{onDelete:'RESTRICT'}) @JoinColumn({name:'categoryId'}) category: StoreCategory;
  @Column({length:150}) name: string;
  @Column({length:2000,default:''}) description: string;
  @Column({type:'numeric',precision:12,scale:2}) price: string;
  @Column({type:'text',nullable:true}) imageUrl: string|null;
  @Column({type:'text',nullable:true,select:false}) imagePublicId: string|null;
  @Column({default:false}) active: boolean;
  @CreateDateColumn({type:'timestamptz'}) createdAt: Date;
  @UpdateDateColumn({type:'timestamptz'}) updatedAt: Date;
}
@Entity('group_chat_messages') @Index(['groupId','senderKey','clientMessageId'],{unique:true}) @Index(['groupId','id'])
export class ChatMessage {
  @PrimaryGeneratedColumn({type:'bigint'}) id: string;
  @Column('uuid') groupId: string;
  @ManyToOne(()=>Group,{onDelete:'CASCADE'}) @JoinColumn({name:'groupId'}) group: Group;
  @Column({length:50}) senderKey: string;
  @Column({length:160}) senderName: string;
  @Column({type:'text',nullable:true}) avatarUrl: string|null;
  @Column('uuid') clientMessageId: string;
  @Column({type:'varchar',length:2000,nullable:true}) text: string|null;
  @CreateDateColumn({type:'timestamptz'}) createdAt: Date;
  @Column({default:false}) deleted: boolean;
}
export interface TreeElement { id:string; kind:'emoji'|'text'|'image'; value?:string; assetId?:string; x:number; y:number; size:number; rotation:number }
@Entity('group_trees')
export class GroupTree {
  @Column({type:'uuid',primary:true}) groupId: string;
  @ManyToOne(()=>Group,{onDelete:'CASCADE'}) @JoinColumn({name:'groupId'}) group: Group;
  @Column({type:'text',nullable:true}) imageUrl: string|null;
  @Column({type:'text',nullable:true,select:false}) imagePublicId: string|null;
  @Column({type:'jsonb',default:()=>"'[]'::jsonb"}) elements: TreeElement[];
  @Column({default:0}) revision: number;
  @UpdateDateColumn({type:'timestamptz'}) updatedAt: Date;
}
@Entity('group_tree_assets')
export class TreeAsset {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column('uuid') groupId: string;
  @ManyToOne(()=>Group,{onDelete:'CASCADE'}) @JoinColumn({name:'groupId'}) group: Group;
  @Column('text') imageUrl: string;
  @Column({type:'text',select:false}) publicId: string;
}

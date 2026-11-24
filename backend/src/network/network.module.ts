import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Friendship, Store, StoreCategory, StoreProduct, ChatMessage, GroupTree, TreeAsset } from './entities';
import { CommunityController } from './community.controller';
import { StoresController } from './stores.controller';
import { GroupRoomController, GroupRoomGuard } from './group-room.controller';
import { NetworkSupport } from './shared';
@Module({imports:[AuthModule,TypeOrmModule.forFeature([Friendship,Store,StoreCategory,StoreProduct,ChatMessage,GroupTree,TreeAsset])],controllers:[CommunityController,StoresController,GroupRoomController],providers:[NetworkSupport,GroupRoomGuard]})
export class NetworkModule {}

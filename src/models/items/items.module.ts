import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { ItemSchema } from './schemas/item.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'items', schema: ItemSchema }])],
  providers: [ItemsService],
  controllers: [ItemsController],
})
export class ItemsModule {}

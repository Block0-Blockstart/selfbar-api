import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransferSchema } from './schemas/transfer.schema';
import { TransferController } from './transfer.controller';
import { TransferService } from './transfer.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'transfers', schema: TransferSchema }])],
  providers: [TransferService],
  controllers: [TransferController],
})
export class TransferModule {}

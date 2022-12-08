import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContractsModule } from '../../services/contracts/contracts.module';
import { TransferSchema } from './schemas/transfer.schema';
import { TransferController } from './transfer.controller';
import { TransferService } from './transfer.service';

@Module({
  imports: [ContractsModule, MongooseModule.forFeature([{ name: 'transfers', schema: TransferSchema }])],
  providers: [TransferService],
  controllers: [TransferController],
})
export class TransferModule {}

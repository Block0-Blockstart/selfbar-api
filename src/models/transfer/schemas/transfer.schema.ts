import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TransferDocument = Transfer & Document;

// 'transfers' collection
@Schema()
export class Transfer {
  @Prop({ required: true, immutable: true })
  from: string;

  @Prop({ required: true, immutable: true })
  to: string;

  // bn as string
  @Prop({ required: true, immutable: true })
  amount: string;

  // unix timestamp computed when this API received the notarization request
  @Prop({ required: true, immutable: true })
  reqTimestamp: number;
}

export const TransferSchema = SchemaFactory.createForClass(Transfer);

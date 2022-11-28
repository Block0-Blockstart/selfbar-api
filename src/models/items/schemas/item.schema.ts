import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ItemDocument = Item & Document;

// Item class will create a 'items' collection
@Schema()
export class Item {
  // hash of a single document
  @Prop({ required: true, immutable: true })
  hash: string;

  @Prop({ required: true, immutable: true })
  batchId: Types.ObjectId;

  // unix timestamp computed when this API received the notarization request
  @Prop({ required: true, immutable: true })
  reqTimestamp: number;

  // root hash of a merkle tree that owns the single hash
  @Prop({ required: true, immutable: true })
  merkleRoot: string;

  // hash of the notarization transaction
  @Prop({ required: true, immutable: true })
  txHash: string;

  // number of the block where lies the notarization transaction
  @Prop({ required: true, immutable: true })
  txBlock: number;

  // unix timestamp of the block where lies the notarization transaction
  @Prop({ required: true, immutable: true })
  txTimestamp: number;
}

export const ItemSchema = SchemaFactory.createForClass(Item);

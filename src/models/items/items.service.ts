import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { AppConfigService } from '../../config/app/app.config.service';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Item, ItemDocument } from './schemas/item.schema';
import { CreateItemDto } from './dtos/request/create-item.dto';
import { Wallet, ethers } from 'ethers';
import MerkleTree from 'merkletreejs';
import { keccak256 } from '../../utils/hash';
import { TransactionReceipt } from '@ethersproject/abstract-provider';
import { LogDescription } from 'ethers/lib/utils';
import { ContractsService } from '../../services/contracts/contracts.service';

export interface IVerifyPayload {
  verified: boolean;
  hexProof: (string | number)[][];
  merkleRoot: string;
  txHash: string;
}

export interface INotarizeResult {
  txHash: string;
  txBlock: number;
  txTimestamp: number;
}

export interface INotarizeArgs {
  merkleRoot: string;
  reqTimestamp: number;
}

export interface IextractHashEmittedEventResult {
  name: string;
  merkleRoot: string;
  reqTimestamp: number;
}

/**
 * Important: why do we use a batchId ?
 * Because we allow duplicates.
 * Someone can post 2 sets of hashes that are exactly the sames.
 * Each batch will result in the exact same merkleRoot.
 * If we identify a batch by its merkle root, and then we find items by batch,
 * we will receive duplicated hashes. And we could not just filter duplicates, because
 * we also allow duplicates in the same batch.
 */

@Injectable()
export class ItemsService {
  private readonly logger = new Logger('ItemsService');
  private readonly wallet: Wallet;
  private readonly notarizationContract: ethers.Contract;

  constructor(
    private acs: AppConfigService,
    private cs: ContractsService,
    @InjectModel('items') private itemsModel: Model<ItemDocument>
  ) {
    this.wallet = new Wallet(acs.COMMON_PRIVATE_KEY, this.cs.getProvider());
    this.notarizationContract = this.cs.getContractInstance(
      'notarization',
      this.acs.NOTARIZATION_CONTRACT_ADDRESS,
      this.wallet
    );
  }

  /**
   *
   * This is a "all-in-one" function. It will:
   *  * compute a merkle root from a batch of hashes;
   *  * then notarize this root on blockchain;
   *  * then store useful data for each hash in database;
   *
   * Note: DB storage is NOT done if the notarization fails on blockchain.
   *
   * Warning: this function does not check the input, as it should be done
   * by the controller using a dto.
   *
   */
  async create({ hashes }: CreateItemDto): Promise<string> {
    const reqTimestamp = Math.floor(Date.now() / 1000); // unix timestamp

    const merkleRoot = this.computeMerkleRoot(hashes);
    const batchId = new mongoose.Types.ObjectId();

    const { txHash, txBlock, txTimestamp } = await this.notarize({ merkleRoot, reqTimestamp });

    const entries: ItemDocument[] = hashes.map(
      hash => new this.itemsModel({ hash, batchId, reqTimestamp, merkleRoot, txHash, txBlock, txTimestamp })
    );

    Promise.all(entries.map(async e => await e.save())).catch(err => {
      this.logger.error('Error while saving the hashes, db integrity is now compromised!');
      console.error(err);
      throw new InternalServerErrorException('Error while saving the hashes, db integrity is now compromised!');
    });

    return 'success';
  }

  /**
   *
   * Verifies a hash and returns a full proof allowing subsequent verifications without this api.
   *
   */
  async verifyOne(hash: string): Promise<IVerifyPayload> {
    // fetch all items having this has (a same hash may be included in many batches)
    const many = await this.findByHash(hash);
    // not found
    if (many.length === 0) return { verified: false, hexProof: null, merkleRoot: null, txHash: null };
    // to verify the hash, we use the first one stored on chain, so that we have the older block to prove anteriority
    const first = many.sort((a, b) => a.txTimestamp - b.txTimestamp).shift();
    // fetch all items that are part of the merkle root of selected hash
    const items = await this.findByBatchId(first.batchId);
    // keep only the hashes from these items, as they are the merkle leaves
    const leaves = items.map(i => i.hash);
    // fetch the tx receipt for the tx that stored the merkleroot on chain
    const txReceipt = await this.getTx(first.txHash);
    // extract event from tx receipt
    const event = await this.extractHashEmittedEvent(txReceipt);
    // and compares event merkleroot with db-stored merkleroot
    // if it does not match, the hash was not previously notarized in a batch
    if (event.merkleRoot !== first.merkleRoot) {
      return { verified: false, hexProof: null, merkleRoot: null, txHash: null };
    }

    // prepare a useful payload for return, so that the user can later prove the hash existence
    // for this, we could retrun the full tree, as well as the merkleRoot, the alg, and everything needed to
    // recompute the tree. Instead of the full tree, we will use the merkle proof to allow lighter payload.

    //1. need to recreate the tree and the root to generate the proof
    const tree = new MerkleTree(leaves, keccak256, { sort: true });
    const root = tree.getHexRoot();

    //2. need to be sure we are still talking about the same root
    if (root === event.merkleRoot) {
      //3. generate the proof (a path from hash to root)
      const hexProof = tree.getPositionalHexProof(hash);
      //4. the proof must be verifiable by anyone without having the full tree so we check it can be verified this way
      if (MerkleTree.verify(hexProof, hash, root, keccak256, { sort: true })) {
        return { verified: true, hexProof, merkleRoot: root, txHash: first.txHash };
      }
    }
    return { verified: false, hexProof: null, merkleRoot: null, txHash: null };
  }

  /**
   *
   * Get all hashes in a given batch.
   *
   */
  async findHashesByBatchIdString(batchId: string): Promise<string[]> {
    let objId: mongoose.Types.ObjectId;
    try {
      objId = new mongoose.Types.ObjectId(batchId);
    } catch (e) {
      throw new BadRequestException(`${batchId} is not a valid batch id.`);
    }

    const items = await this.findByBatchId(objId);
    return items.map(i => i.hash);
  }

  /**
   *
   * Get all items, between two dates. If second date is null => between date and now.
   *
   */
  async findItemsBetweenDates({ start, end }: { start: number; end: number | null }) {
    return await this.itemsModel
      .find({ reqTimestamp: { $gte: start, $lte: end || Math.round(Date.now() / 1000) } })
      .exec();
  }

  /**
   *
   * Get last n batches (limit=n).
   * A batch does not exists 'as-is' in db, this is a constructed object used in frontend reports.
   *
   */
  findLastBatches(limit: number) {
    return new Promise((resolve, reject) => {
      this.itemsModel.aggregate(
        [
          {
            $addFields: {
              convertedId: { $toObjectId: '$batchId' },
            },
          },
          {
            $group: {
              _id: '$batchId',
              hashes: { $sum: 1 },
              reqTimestamp: { $min: '$reqTimestamp' },
              txTimestamp: { $min: '$txTimestamp' },
              merkleRoot: { $min: '$merkleRoot' },
              txBlock: { $min: '$txBlock' },
            },
          },
          { $sort: { reqTimestamp: -1 } },
          { $limit: limit },
        ],
        function (err, results) {
          if (err) reject('aggregation error');
          const res = results.map(r => {
            const { _id, ...rest } = r;
            return { ...rest, batchId: _id.toString() };
          });
          resolve(res);
        }
      );
    });
  }

  /**
   *
   * Get number of hashes by day, between two dates. If second date is null => between date and now.
   *
   */
  async findNumberOfHashesByDay({ start, end }: { start: number; end: number | null }) {
    // we will consider a "day" is a date at 0h00
    const findDay = (unixTimestamp: number) => new Date(unixTimestamp * 1000).setHours(0, 0, 0, 0) / 1000;
    // and the "day after" is 24h00 later
    const findNextDay = (unixTimestamp: number) => unixTimestamp + 24 * 60 * 60;

    // find the first day to return
    start = findDay(start);
    // find the last day to return
    end = findDay(end || Math.round(Date.now() / 1000));
    // creates a mapping with first and last days, initialized with 0 hashes
    const days = new Map([
      [start, 0],
      [end, 0],
    ]);
    // add all the days in between, and initialize them to 0 hashes
    let nextDay = findNextDay(start);
    while (nextDay < end) {
      days.set(nextDay, 0);
      nextDay = findNextDay(nextDay);
    }
    // The database knows nothing about our concept of "day".
    // So, we need to search all timestamps between day one at 0h00 and last day at 23h59.
    // Then we will parse the results to remap each timestamp to a "day".
    const lastTimestampToInclude = new Date(end * 1000).setHours(23, 59, 59, 0) / 1000;

    return new Promise((resolve, reject) => {
      this.itemsModel.aggregate(
        [
          // condition: timestamps to include
          { $match: { reqTimestamp: { $gte: start, $lte: lastTimestampToInclude } } },
          // group by timestamp so we can compute the number of hashes recorded at same time
          { $group: { _id: '$reqTimestamp', hashes: { $sum: 1 } } },
        ],
        (err, results) => {
          if (err) reject('aggregation error');
          try {
            // replace each timestamp by the "day" concept.
            const withDays = results.map(e => ({ hashes: e.hashes, day: findDay(e._id) }));
            // fill the days mapping with the number of hashes by day
            withDays.forEach(d => days.set(d.day, days.get(d.day) + d.hashes));
            //transform the mapping to a result object, ordered in desc by date
            const res = [...days].map(d => ({ day: d[0], hashes: d[1] })).sort((a, b) => b.day - a.day);
            resolve(res);
          } catch (e) {
            reject('parsing error');
          }
        }
      );
    });
  }

  /**
   * (! should be restricted to ADMIN by the controller)
   */
  async adminFindAll(): Promise<Item[]> {
    return await this.itemsModel.find().exec();
  }

  /**
   * (! should be restricted to ADMIN by the controller)
   */
  async adminFindOne(id: string): Promise<Item> {
    return await this.itemsModel.findOne({ _id: id }).exec();
  }

  /**
   * (! should be restricted to ADMIN by the controller)
   */
  async adminDelete(id: string) {
    return await this.itemsModel.findByIdAndRemove({ _id: id }).exec();
  }

  /////////////////////////////////////////////////////////////////////////////
  ////////////                 Private methods                     ////////////
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Only errors that should return an HTTP exception are managed.
   * ==> if another error is thrown, it means something should be fixed in the code.
   */
  private async notarize({ merkleRoot, reqTimestamp }: INotarizeArgs): Promise<INotarizeResult> {
    // merkleRoot expects a bytes32 and reqTimestamp expects a uint.
    const { blockNumber: txBlock, transactionHash: txHash } = await this.cs.sendTx(() =>
      this.notarizationContract.emitHash(merkleRoot, reqTimestamp)
    );
    const block = await this.cs.getProvider().getBlock(txBlock);
    return { txBlock, txHash, txTimestamp: block.timestamp };
  }

  /**
   *
   * From an array of hashes, computes a merkle root.
   *
   */
  private computeMerkleRoot(hashes: string[]): string {
    const leaves = [...hashes];
    const tree = new MerkleTree(leaves, keccak256, { sort: true });
    return tree.getHexRoot(); // getHexRoot outputs a 0x prefixed hexstring
  }

  /**
   *
   */
  private async findByHash(hash: string): Promise<Item[]> {
    return await this.itemsModel.find({ hash }).exec();
  }

  /**
   *
   */
  private async findByBatchId(batchId: mongoose.Types.ObjectId): Promise<Item[]> {
    return await this.itemsModel.find({ batchId }).exec();
  }

  /**
   * get a tx from polygon
   */
  private async getTx(txHash: string): Promise<TransactionReceipt> {
    let txReceipt: TransactionReceipt;
    try {
      txReceipt = await this.cs.getProvider().getTransactionReceipt(txHash);
    } catch (e) {
      this.logger.error(`Failed while retrieving transaction receipt for txHash: ${txHash}.`);
      console.error(e);
      throw new Error(`Failed while retrieving transaction receipt for txHash: ${txHash}.`);
    }
    return txReceipt;
  }

  /**
   * read logs from tx, extract events, return parsed events
   */
  private async extractEvents(txr: TransactionReceipt, eventName: string): Promise<LogDescription> {
    // contract interface
    const itf = this.notarizationContract.interface;
    // parse each log (in our current contract, there is only one event, but this could change)
    const parsedLogs = txr.logs.map(l => itf.parseLog(l));
    // search the event with desired name
    const log = parsedLogs.filter(e => e.name === eventName);
    // not found
    if (log.length === 0) return null;
    // found more than one
    if (log.length > 1) {
      this.logger.error(`Dangerous behavior from tx ${txr.transactionHash} : multiple events with the same name.`);
      throw new Error(`Dangerous behavior from tx ${txr.transactionHash} : multiple events with the same name.`);
    }
    //now we can safely assume that log[0] exists and is the only one matching the desired event
    return log[0];
  }

  /**
   * read logs from tx, extract 'hashEmitted' event, returns it as a parsed key/values object
   */
  private async extractHashEmittedEvent(txr: TransactionReceipt): Promise<IextractHashEmittedEventResult> {
    const { name, args } = await this.extractEvents(txr, 'hashEmitted');
    const { merkleRoot, reqTimestamp } = args;
    return {
      name,
      merkleRoot,
      reqTimestamp: ethers.BigNumber.from(reqTimestamp).toNumber(),
    };
  }
}

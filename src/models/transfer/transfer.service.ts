import { Inject, Injectable, Logger } from '@nestjs/common';
import { Wallet, ethers, BigNumber } from 'ethers';
import { TransactionReceipt } from '@ethersproject/abstract-provider';
import { AppConfigService } from '../../config/app/app.config.service';
import { getPattern } from '../../config/contracts/getPatterns';
import { sendTx } from '../../utils/ethers-helpers';
import { Model } from 'mongoose';
import { TransferDocument } from './schemas/transfer.schema';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class TransferService {
  private readonly logger = new Logger('DocumentsService');
  private readonly commonWallet: Wallet;
  private readonly erc20Contract: ethers.Contract;
  private readonly stakeholderAContract: ethers.Contract;
  private readonly stakeholderBContract: ethers.Contract;

  constructor(
    @InjectModel('transfers') private transferModel: Model<TransferDocument>,
    @Inject('JSON_RPC_PROVIDER') private jsonRpcProvider: ethers.providers.JsonRpcProvider,
    private cs: AppConfigService
  ) {
    this.commonWallet = new Wallet(cs.COMMON_PRIVATE_KEY, this.jsonRpcProvider);
    this.erc20Contract = new ethers.Contract(
      this.cs.ERC20_CONTRACT_ADDRESS,
      getPattern('token').abi,
      this.commonWallet
    );
    this.stakeholderAContract = new ethers.Contract(
      this.cs.STAKEHOLDER_A_CONTRACT_ADDRESS,
      getPattern('stakeholder').abi,
      this.commonWallet
    );
    this.stakeholderBContract = new ethers.Contract(
      this.cs.STAKEHOLDER_B_CONTRACT_ADDRESS,
      getPattern('stakeholder').abi,
      this.commonWallet
    );
  }

  /**
   *
   * Transfers an amount (in SBAR token smallest unit) from one stakeholder contract to the other.
   * The recipient is always the poorest stakeholder.
   *
   */
  async transfer(amount: BigNumber): Promise<TransactionReceipt> {
    if (amount.eq(0)) throw new Error('Forbidden transfer (amount = 0).');

    const balanceA = await this.erc20Contract.balanceOf(this.stakeholderAContract.address);
    const balanceB = await this.erc20Contract.balanceOf(this.stakeholderBContract.address);

    let ctFrom: ethers.Contract;
    let ctTo: ethers.Contract;

    if (balanceA.gt(balanceB)) {
      ctFrom = this.stakeholderAContract;
      ctTo = this.stakeholderBContract;
    } else {
      ctFrom = this.stakeholderBContract;
      ctTo = this.stakeholderAContract;
    }

    const txReceipt = await sendTx(() => ctFrom.transfer(ctTo.address, amount));
    await new this.transferModel({
      from: ctFrom.address,
      to: ctTo.address,
      reqTimestamp: Date.now() / 1000,
      amount: amount.toString(),
    }).save();
    this.logger.verbose(
      `Transfered ${amount.toString()} SBAR (1e-18 unit) from (${ctFrom.address}) to B (${ctTo.address}).`
    );
    return txReceipt;
  }

  async sumBetweenDates({ start, end }: { start: number; end: number }): Promise<string> {
    const movements = await this.transferModel.find({ reqTimestamp: { $gte: start, $lte: end } }).exec();
    const totalBn = movements.reduce((prev, curr) => prev.add(BigNumber.from(curr.amount)), BigNumber.from(0));
    return totalBn.toString();
  }

  async movementsBetweenDates({ start, end }: { start: number; end: number }): Promise<TransferDocument[]> {
    return await this.transferModel.find({ reqTimestamp: { $gte: start, $lte: end } }).exec();
  }
}

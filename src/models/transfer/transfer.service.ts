import { Injectable, Logger } from '@nestjs/common';
import { Wallet, ethers, BigNumber } from 'ethers';
import { TransactionReceipt } from '@ethersproject/abstract-provider';
import { AppConfigService } from '../../config/app/app.config.service';
import { Model } from 'mongoose';
import { TransferDocument } from './schemas/transfer.schema';
import { InjectModel } from '@nestjs/mongoose';
import { ContractsService } from '../../services/contracts/contracts.service';

@Injectable()
export class TransferService {
  private readonly logger = new Logger('TransferService');
  private readonly commonWallet: Wallet;
  private readonly erc20Contract: ethers.Contract;
  private readonly stakeholderAContract: ethers.Contract;
  private readonly stakeholderBContract: ethers.Contract;

  constructor(
    private acs: AppConfigService,
    private cs: ContractsService,
    @InjectModel('transfers') private transferModel: Model<TransferDocument>
  ) {
    this.commonWallet = new Wallet(acs.COMMON_PRIVATE_KEY, this.cs.getProvider());
    this.erc20Contract = this.cs.getContractInstance('token', this.acs.ERC20_CONTRACT_ADDRESS, this.commonWallet);
    this.stakeholderAContract = this.cs.getContractInstance(
      'stakeholder',
      this.acs.STAKEHOLDER_A_CONTRACT_ADDRESS,
      this.commonWallet
    );
    this.stakeholderBContract = this.cs.getContractInstance(
      'stakeholder',
      this.acs.STAKEHOLDER_B_CONTRACT_ADDRESS,
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

    const txReceipt = await this.cs.sendTx(() => ctFrom.transfer(ctTo.address, amount));
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

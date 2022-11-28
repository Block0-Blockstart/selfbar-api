import { BadRequestException, Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BigNumber } from 'ethers';
import { rndBnUnit } from '../../utils/math';
import { castUint } from '../../utils/query-validators';
import { TransferDto } from './dtos/request/transfer.dto';
import { TransferService } from './transfer.service';

@ApiTags('transfer')
@Controller('transfer')
export class TransferController {
  constructor(private transferService: TransferService) {}

  @ApiOperation({
    summary:
      'Transfer a token amount from richest to poorest account. Amount is represented in the smallest unit (1e-18 SBAR).',
  })
  @Post()
  async transfer(@Body() dto: TransferDto) {
    let amount: BigNumber;
    try {
      amount = BigNumber.from(dto.amount);
    } catch (e) {
      throw new BadRequestException('amount is not parseable to big number');
    }
    return await this.transferService.transfer(amount);
  }

  @ApiOperation({
    summary: 'Transfer a random token amount (between 1 and 10 SBAR) from richest to poorest account.',
  })
  @Post('random')
  async transferRandom() {
    // random amount between 1 and 10 tokens (with 18 precision)
    const amount = rndBnUnit(1, 10, 18);
    return await this.transferService.transfer(amount);
  }

  @ApiOperation({
    summary: 'Get all transfers between start and end dates. Dates must be Unix timestamps.',
  })
  @Get('movements/:start/:end')
  async movementsBetweenDates(@Param('start') start: string, @Param('end') end: string) {
    return this.transferService.movementsBetweenDates({
      start: castUint('start', start),
      end: castUint('end', end),
    });
  }

  @ApiOperation({
    summary: 'Get the sum of all transfers between start and end dates. Dates must be Unix timestamps.',
  })
  @Get('sum/:start/:end')
  async sumBetweenDates(@Param('start') start: string, @Param('end') end: string) {
    return this.transferService.sumBetweenDates({
      start: castUint('start', start),
      end: castUint('end', end),
    });
  }

  @ApiOperation({
    summary: 'Get the sum of all transfers from start date until now. Date must be Unix timestamp.',
  })
  @Get('sum/:start')
  async sumFromDate(@Param('start') start: string) {
    return this.transferService.sumBetweenDates({
      start: castUint('start', start),
      end: Math.round(Date.now() / 1000),
    });
  }
}

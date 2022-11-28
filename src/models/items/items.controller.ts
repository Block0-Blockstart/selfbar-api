import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dtos/request/create-item.dto';
import { AdminGuard } from '../../common/guards/admin.guard';
import { Item } from './schemas/item.schema';
import { castUint } from '../../utils/query-validators';

@ApiTags('item')
@Controller('item')
export class ItemsController {
  constructor(private itemsService: ItemsService) {}

  @ApiOperation({ summary: 'Notarize an array of hashes.' })
  @Post()
  async create(@Body() dto: CreateItemDto) {
    return await this.itemsService.create(dto);
  }

  @ApiOperation({ summary: 'Verify a single hashe (proof of existence).' })
  @Get('verify/:hash')
  async verify(@Param('hash') hash: string) {
    return await this.itemsService.verifyOne(hash);
  }

  @ApiOperation({ summary: 'Get all hashes included in a batch of hashes.' })
  @Get('hashes-by-batch/:batchId')
  async findByBatchId(@Param('batchId') batchId: string) {
    return await this.itemsService.findHashesByBatchIdString(batchId);
  }

  @ApiOperation({ summary: 'Get all hashes between start and end dates. Dates must be Unix timestamps.' })
  @Get('between-dates/:start/:end')
  async findHashesBetweenDates(@Param('start') start: string, @Param('end') end: string) {
    return await this.itemsService.findItemsBetweenDates({
      start: castUint('start', start),
      end: castUint('end', end),
    });
  }

  @ApiOperation({ summary: 'Get all hashes from start date until now. Date must be Unix timestamp.' })
  @Get('between-dates/:start')
  async findHashesFromDate(@Param('start') start: string) {
    return await this.itemsService.findItemsBetweenDates({
      start: castUint('start', start),
      end: null,
    });
  }

  @ApiOperation({ summary: 'Get last n batches.' })
  @Get('last-batches/:limit')
  async findLastBatches(@Param('limit') limit: string) {
    return await this.itemsService.findLastBatches(castUint('limit', limit));
  }

  @ApiOperation({
    summary:
      'Get the number of hashes by day, between start and end dates. Dates must be Unix timestamps. The response will include full days (for example, if start timestamp refers to 1st January at 6PM, the response include the entire 1st January (from 0:00).',
  })
  @Get('number-hashes-by-day/:start/:end')
  async findNumberOfHashesByDayBetween(@Param('start') start: string, @Param('end') end: string) {
    return await this.itemsService.findNumberOfHashesByDay({
      start: castUint('start', start),
      end: castUint('end', end),
    });
  }

  @ApiOperation({
    summary:
      'Get the number of hashes by day, from start date until now. Date must be Unix timestamp. The response will include full days (for example, if start timestamp refers to 1st January at 6PM, the response include the entire 1st January (from 0:00).',
  })
  @Get('number-hashes-by-day/:start')
  async findNumberOfHashesByDayFrom(@Param('start') start: string) {
    return await this.itemsService.findNumberOfHashesByDay({
      start: castUint('start', start),
      end: null,
    });
  }

  @ApiOperation({ summary: 'ADMIN PROTECTED. Find all hashes in database.' })
  @ApiHeader({ name: 'sbadm', description: 'admin private key' })
  @Get()
  @UseGuards(AdminGuard)
  async findAll(): Promise<Item[]> {
    return await this.itemsService.adminFindAll();
  }

  @ApiOperation({ summary: 'ADMIN PROTECTED. Find one hash by id in database.' })
  @ApiHeader({ name: 'sbadm', description: 'admin private key' })
  @Get(':id')
  @UseGuards(AdminGuard)
  async findOne(@Param('id') id: string): Promise<Item> {
    return await this.itemsService.adminFindOne(id);
  }

  @ApiOperation({
    summary: 'ADMIN PROTECTED. Delete one hash by id in database. This will obviously NOT delete from the blockchain.',
  })
  @ApiHeader({ name: 'sbadm', description: 'admin private key' })
  @Delete(':id')
  @UseGuards(AdminGuard)
  async delete(@Param('id') id: string) {
    return await this.itemsService.adminDelete(id);
  }
}

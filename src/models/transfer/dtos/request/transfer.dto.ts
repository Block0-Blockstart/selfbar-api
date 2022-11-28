import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class TransferDto {
  @ApiProperty()
  @IsString()
  amount: string;
}

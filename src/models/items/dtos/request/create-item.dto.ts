import { ApiProperty } from '@nestjs/swagger';
import { IsHashes } from '../../../../common/validators/isHashes';

export class CreateItemDto {
  @ApiProperty()
  @IsHashes('keccak256')
  readonly hashes: string[];
}

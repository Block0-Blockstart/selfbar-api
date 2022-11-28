import { BadRequestException } from '@nestjs/common';

export const castUint = (key: string, value: any) => {
  if (/^[0-9]+/.test(value)) return Number.parseInt(value);
  else throw new BadRequestException(`${key} must be a number.`);
};

import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';
import { IClass } from './interfaces';

type algo =
  | 'md5'
  | 'md4'
  | 'sha1'
  | 'sha256'
  | 'sha384'
  | 'sha512'
  | 'ripemd128'
  | 'ripemd160'
  | 'tiger128'
  | 'tiger160'
  | 'tiger192'
  | 'crc32'
  | 'crc32b'
  | 'keccak256';

const lengths = {
  md5: 32,
  md4: 32,
  sha1: 40,
  sha256: 64,
  sha384: 96,
  sha512: 128,
  ripemd128: 32,
  ripemd160: 40,
  tiger128: 32,
  tiger160: 40,
  tiger192: 48,
  crc32: 8,
  crc32b: 8,
  keccak256: 64,
};

export const IsHashes = (algorithm: algo, validationOptions?: ValidationOptions): PropertyDecorator => {
  let reason: string;

  return (obj: IClass, propertyName: string) => {
    registerDecorator({
      name: 'IS_HASHES',
      target: obj.constructor,
      propertyName,
      options: validationOptions,
      constraints: [algorithm],
      validator: {
        validate: (value: any, _validationArguments?: ValidationArguments) => {
          //not an array
          if (!Array.isArray(value)) {
            reason = '$property must be an array.';
            return false;
          }
          //empty array
          if (value.length === 0) {
            reason = '$property must not be an empty array.';
            return false;
          }
          //not an array of 256bits hexstrings
          const validLen = lengths[algorithm];
          const validHash = new RegExp(`^0x[a-fA-F0-9]{${validLen}}$`);

          for (let i = 0; i < value.length; i++) {
            if (typeof value[i] !== 'string') {
              reason = '$property must be an array containing only strings.';
              return false;
            } else if (!validHash.test(value[i])) {
              reason = `$property must be an array. Each element must be an hexstring having ${
                2 + validLen
              } characters ('0x' prefix + ${validLen}).`;
              return false;
            }
          }
          return true;
        },
        defaultMessage: (_validationArguments?: ValidationArguments) => reason,
      },
    });
  };
};

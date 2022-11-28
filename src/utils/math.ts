import { BigNumber } from 'ethers';
import { randomBytes } from 'ethers/lib/utils';

/**
 *
 * Returns a random big number between bounds.
 * This is NOT a 100% true random and this is NOT protected against modulo bias.
 * (see https://www.dev-notes.eu/2020/06/Pseudo-Random-Numbers-in-a-Range-and-Modulo-Bias/)
 * Just used here for demo purposes.
 */
export function rndBn(min: string, max: string) {
  const minBn = BigNumber.from(min);
  const maxBn = BigNumber.from(max);

  if (minBn.gt(maxBn)) throw new Error('rndBn: max cannot be less than min.');
  if (minBn.lt(0)) throw new Error('rndBn: negtive values not accepted.');

  const modulus = maxBn.sub(minBn).add(1);
  const rnd = BigNumber.from(randomBytes(32)).mod(modulus);
  return rnd.add(minBn);
}

/**
 *
 * Returns a random big number between bounds.
 *
 * Bounds are given in base unit.
 *
 * Precision is the length of significant numbers after the base unit.
 *
 * This is NOT a 100% true random and this is NOT protected against modulo bias.
 * (see https://www.dev-notes.eu/2020/06/Pseudo-Random-Numbers-in-a-Range-and-Modulo-Bias/)
 *
 * @example
 * min = 1 ; max = 2; precision = 9;
 * // possible outputs: 1000000000, 1000000001, 1556884156, 1999999999
 *
 */
export function rndBnUnit(min: number, max: number, precision: number) {
  const minStr = min + '' + Array(precision).fill('0').join('');
  const maxStr = max + '' + Array(precision).fill('0').join('');

  return rndBn(minStr, maxStr);
}

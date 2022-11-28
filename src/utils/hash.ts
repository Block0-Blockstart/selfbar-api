import { ethers } from 'ethers';

// attention, le hash doit être un string (en utf-8)
export function keccak256(str: string) {
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(str + ''));
}

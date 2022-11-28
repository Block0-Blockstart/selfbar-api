/* eslint-disable @typescript-eslint/no-var-requires */
const ethers = require('ethers');

function main() {
  const wallet = ethers.Wallet.createRandom();

  console.log({
    wallet: {
      address: wallet.address,
      publicKey: wallet.publicKey,
      mnemonic: wallet.mnemonic.phrase,
      privateKey: wallet.privateKey,
    },
  });

  return wallet;
}

main();

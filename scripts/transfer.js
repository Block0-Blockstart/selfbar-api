/* eslint-disable @typescript-eslint/no-var-requires */
const ethers = require('ethers');
const minimist = require('minimist');
const { getPattern, hasArray } = require('./utils');

async function main() {
  // stakeholderFromOwnerPrivateKey = the pk of the owner of the stakeholder contract that should send the amount
  // stakeholderFromAddress = the address the stakeholder contract that should send the amount
  // stakeholderToAddress = the address the stakeholder contract that should receive the amount
  // amount = in SBAR
  const { stakeholderFromOwnerPrivateKey, stakeholderFromAddress, stakeholderToAddress, provider, amount } = minimist(
    process.argv.slice(2),
    {
      string: ['stakeholderFromOwnerPrivateKey', 'provider', 'stakeholderFromAddress', 'stakeholderToAddress'],
      number: ['amount'],
    }
  );

  if (!stakeholderFromOwnerPrivateKey || !provider || !stakeholderFromAddress || !stakeholderToAddress || !amount)
    throw new Error(
      'Missing arg. Require provider, stakeholderFromOwnerPrivateKey, stakeholderFromAddress, stakeholderToAddress, amount.'
    );
  // arg received twice or more
  if (hasArray([stakeholderFromOwnerPrivateKey, stakeholderFromAddress, stakeholderToAddress, provider, amount]))
    throw new Error('One or more args are duplicated.');

  const wallet = new ethers.Wallet(stakeholderFromOwnerPrivateKey, new ethers.providers.JsonRpcProvider(provider));

  const { abi } = getPattern('stakeholder');
  const contract = new ethers.Contract(stakeholderFromAddress, abi, wallet);

  // 1 SBAR = 10E18
  const tx = await contract.transfer(stakeholderToAddress, ethers.BigNumber.from(10).pow(18).mul(amount));
  const txReceipt = await tx.wait(); // wait txReceipt

  console.log(`Transfer done (${amount} SBAR, tx hash = ${txReceipt.transactionHash}).`);
}

main();

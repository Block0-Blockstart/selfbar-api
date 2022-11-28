/* eslint-disable @typescript-eslint/no-var-requires */
const ethers = require('ethers');
const minimist = require('minimist');
const { getPattern, hasArray } = require('./utils');

// TODO: could be improved by passing the transfer amount as arg
async function main() {
  const { deployPrivateKey, tokenPrivateKey, provider, tokenAddress } = minimist(process.argv.slice(2), {
    string: ['deployPrivateKey', 'tokenPrivateKey', 'provider', 'tokenAddress'],
  });

  if (!deployPrivateKey || !tokenPrivateKey || !provider || !tokenAddress)
    throw new Error('Missing arg. Require provider, deployPrivateKey, tokenPrivateKey, tokenAddress.');
  // arg received twice or more
  if (hasArray([deployPrivateKey, tokenPrivateKey, provider, tokenAddress]))
    throw new Error('One or more args are duplicated.');

  const deployerWallet = new ethers.Wallet(deployPrivateKey, new ethers.providers.JsonRpcProvider(provider));

  // deploy two stakeholder contracts
  const { abi, bytecode } = getPattern('stakeholder');
  const contractFactory = new ethers.ContractFactory(abi, bytecode, deployerWallet);

  const stakeholder1 = await contractFactory.deploy(tokenAddress);
  await stakeholder1.deployTransaction.wait(); // wait txReceipt
  console.log(`Contract Stakeholder A deployed at address: ${stakeholder1.address}`);

  const stakeholder2 = await contractFactory.deploy(tokenAddress);
  await stakeholder2.deployTransaction.wait(); // wait txReceipt
  console.log(`Contract Stakeholder B deployed at address: ${stakeholder2.address}`);

  // retrieve already deployed erc20 token contract
  const { abi: sbarAbi } = getPattern('token');
  const tokenWallet = new ethers.Wallet(tokenPrivateKey, new ethers.providers.JsonRpcProvider(provider));
  const tokenContract = new ethers.Contract(tokenAddress, sbarAbi, tokenWallet);

  // transfer some token from erc20 token contract to each stakeholders
  const tx1 = await tokenContract.transfer(stakeholder1.address, ethers.BigNumber.from(10).pow(21));
  const txReceipt1 = await tx1.wait();

  console.log(`Transfered tokens from ERC20 minter to Stakeholder A (tx hash = ${txReceipt1.transactionHash})`);

  const tx2 = await tokenContract.transfer(stakeholder2.address, ethers.BigNumber.from(10).pow(21));
  const txReceipt2 = await tx2.wait();

  console.log(`Transfered tokens from ERC20 minter to Stakeholder B (tx hash = ${txReceipt2.transactionHash})`);

  return { contract1: stakeholder1.address, contract2: stakeholder2.address };
}

main();

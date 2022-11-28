# SelfBar API

## Pre-configured wallets used for the proof of concept

### Wallet 1 (used to deploy Token contract)

```
Owner private key:  <contact us to get this key, not published on this public repo>
Owner address:      0x12a1a59AFdCC6bae61C6ACFd8372425Fb0de369C
```

### Wallet 2 (used to deploy all other contracts)
```
Owner private key:  <contact us to get this key, not published on this public repo>
Owner address:      0xD647f4E6A866007e0d19eb1C9D970211D238D156
```

## Pre-installation

:warning:

The whole pre-installation is already done and the application can be launched as-is, with the current values provided in environment variables.                

**So you can skip this section, unless if you want to completely reboot the installation and <u>you know what you do</u>.**

On the first deployment or for reinstalling from scratch, the system requires some initial setup: 
- Two wallets
- Four deployed contracts

Some scripts are provided to help this pre-installation process.


1. **Create wallets**

This script outputs a new generated wallet.
```bash
$ node scripts/create-wallet

output:
{
  wallet: {
    address: '0x....',
    publicKey: '0x....',
    mnemonic: 'fatigue gown pitch august ...',
    privateKey: '0x....'
  }
}
```
Run the script and **copy the private key**.      
On your machine, create a text file and paste the private key like this:
```
ERC20_PRIVATE_KEY=0x....
```
Run the script a second time and **copy the private key**.      
In your text file, add a second line:
```
ERC20_PRIVATE_KEY=0x.... 
COMMON_PRIVATE_KEY=0x.... 
```

The first key will used to deploy the ERC20 minter contract.     
The second will be used to deploy all other contracts.     


2. **Deploy the ERC20 minter contract**

The following script requires two arguments.         
- privateKey: it is the ERC20_PRIVATE_KEY that we have generated.
- provider: it is the url to connect to a node using JSON-RPC. For the Polygon testnet, this url is ```https://rpc-mumbai.maticvigil.com```

```bash
$ node scripts/deploy-token --privateKey <your-ERC20_PRIVATE_KEY> --provider <blockchain-entry-point>

output:
 "Contract address: 0x...."
```
Run the script and save the address in your text file like this: 
```
ERC20_PRIVATE_KEY=0x.... 
COMMON_PRIVATE_KEY=0x.... 
ERC20_CONTRACT_ADDRESS=0x....
```


3. **Deploy the stakeholders contracts**

A stakeholder is a basic contract that can receive and send some tokens.
The script below will deploy two stakeholders and will send them some tokens to start with.
The script requires four arguments.         
- tokenPrivateKey: it is the ERC20_PRIVATE_KEY that we have generated.
- deployPrivateKey: it is the COMMON_PRIVATE_KEY that we have generated.
- tokenAddress: it is the ERC20_CONTRACT_ADDRESS that we have generated.
- provider: it is the url to connect to a node using JSON-RPC. For the Polygon testnet, this url is ```https://rpc-mumbai.maticvigil.com```


```bash
$ node scripts/deploy-stakeholders-and-transfer --deployPrivateKey <your-COMMON_PRIVATE_KEY> --tokenPrivateKey <your-ERC20_PRIVATE_KEY> --tokenAddress <your-ERC20_CONTRACT_ADDRESS> --provider <blockchain-entry-point>

output:
  "Contract Stakeholder A deployed at address: 0x............"
  "Contract Stakeholder B deployed at address: 0x............"
  "Transfered tokens from ERC20 minter to Stakeholder A (tx hash = 0x.......)."
  "Transfered tokens from ERC20 minter to Stakeholder B (tx hash = 0x.......)."
```
Run the script and save the addresses in your text file like this: 
```
ERC20_PRIVATE_KEY=0x.... 
COMMON_PRIVATE_KEY=0x.... 
ERC20_CONTRACT_ADDRESS=0x....
STAKEHOLDER_A_CONTRACT_ADDRESS=0x....
STAKEHOLDER_B_CONTRACT_ADDRESS=0x....
```


4. **Deploy the notarization contract**

The script below will deploy a notarization contract. To make it simple in this proof of concept, we reuse the COMMON_PRIVATE_KEY.             
The script requires two arguments.         
- privateKey: it is the COMMON_PRIVATE_KEY that we have generated.
- provider: it is the url to connect to a node using JSON-RPC. For the Polygon testnet, this url is ```https://rpc-mumbai.maticvigil.com```


```bash
$ node scripts/deploy-notarization --privateKey <your-COMMON_PRIVATE_KEY> --provider <blockchain-entry-point>

output:
 "Contract address: 0x...."
```
Run the script and save the addresses in your text file like this: 
```
ERC20_PRIVATE_KEY=0x.... 
COMMON_PRIVATE_KEY=0x.... 
ERC20_CONTRACT_ADDRESS=0x....
STAKEHOLDER_A_CONTRACT_ADDRESS=0x....
STAKEHOLDER_B_CONTRACT_ADDRESS=0x....
NOTARIZATION_CONTRACT_ADDRESS=0x....
```

4. **Setup the environment variables**

Open the file at project root named ```.env.dev``` (for development) an/or the ```.env.prod``` (for production).          
Just copy/paste your text file content inside the desired env file (replace pre-existing values if you don't need them anymore).


## Running the app in dev mode

You need to install the packages:
```bash
$ npm install
```

Then launch the database:
```bash
$ npm run docker:dev:up
```

Then launch the app:
```bash
# without watch mode
$ npm run start

# watch mode
$ npm run start:dev
```

Stop the database with: 
```bash
$ npm run docker:dev:down
```


## Running the app in prod mode
There is no real production mode as this project is a proof of concept.      
But we emulate production by dockerizing everything, allowing for easy deployment (on AWS EC2 for example).

Just run: 
```bash
$ npm run docker:prod:up
```

Stop it with: 
```bash
$ npm run docker:prod:down
```

# Contact
**block0**
+ info@block0.io
+ [https://block0.io/](https://block0.io/)

# License
This repository is released under the [MIT License](https://opensource.org/licenses/MIT).

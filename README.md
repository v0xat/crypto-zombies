# Crypto Zombies

A Dapp for the Ethereum based zombie game.

Made by tutorials from https://cryptozombies.io/, but with upgraded Solidity version and tests.

Frontend part is still in progress...
### Tech Stack

Contracts: Solidity, Hardhat, Ethers

Testing: mocha, chai, hardhat-ethers

Frontend: React, Bootstrap

## Running locally
1. Install deps via `make install`
2. Start local blockchain `make start-backend`
3. Deploy contracts `make deploy-contracts`
4. Run the app with `make start-frontend` and open a browser on `http://localhost:3000`

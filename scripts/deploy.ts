import { ethers, artifacts } from "hardhat";
import { Contract } from "ethers";
import * as path from "path";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const CryptoZombies = await ethers.getContractFactory("CryptoZombies");
  const cryptoZombies = await CryptoZombies.deploy();
  await cryptoZombies.deployed();

  console.log("CryptoZombies deployed to:", cryptoZombies.address);

  const CryptoKitties = await ethers.getContractFactory("KittyCore");
  const cryptoKitties = await CryptoKitties.deploy();
  await cryptoKitties.deployed();

  console.log("CryptoKitties deployed to:", cryptoKitties.address);

  // We also save the contract's artifacts and address in the frontend directory
  saveFrontendFiles(cryptoZombies);
}

const saveFrontendFiles = (cryptoZombies: Contract) => {
  const fs = require("fs");
  const contractsDir = path.join(__dirname, "/../frontend/src/contracts");

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    contractsDir + "/contract-address.json",
    JSON.stringify({ CryptoZombies: cryptoZombies.address }, undefined, 2)
  );

  const CryptoZombiesArtifact = artifacts.readArtifactSync("CryptoZombies");

  fs.writeFileSync(
    contractsDir + "/CryptoZombies.json",
    JSON.stringify(CryptoZombiesArtifact, null, 2)
  );
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

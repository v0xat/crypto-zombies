import { ethers } from "hardhat";

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
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

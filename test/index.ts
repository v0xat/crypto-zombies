import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

describe("CryptoZombies", function () {
  let cryptoZombies: Contract, cryptoKitties: Contract;
  let kittyContractAddress: string;
  let owner: SignerWithAddress,
    alice: SignerWithAddress,
    bob: SignerWithAddress;
  let addrs: SignerWithAddress[];

  const zombieNames = ["Stubbs", "Gary"];
  const firstZombieId = 0;
  const secondZombieId = 1;
  const testKittyId: number = 1;

  beforeEach(async () => {
    [owner, alice, bob, ...addrs] = await ethers.getSigners();

    const CryptoZombies = await ethers.getContractFactory("CryptoZombies");
    cryptoZombies = await CryptoZombies.deploy();
    await cryptoZombies.deployed();

    const CryptoKitties = await ethers.getContractFactory("KittyCore");
    cryptoKitties = await CryptoKitties.deploy();
    await cryptoKitties.deployed();
    kittyContractAddress = cryptoKitties.address;

    // Creating a new cat to use it in further tests
    await cryptoKitties.createPromoKitty(1234, owner.address);
  });

  describe("Creating a zombie", function () {
    it("Should be able to create a new zombie", async () => {
      await cryptoZombies.createRandomZombie(zombieNames[0]);
      const zombieOwner = await cryptoZombies.ownerOf(firstZombieId);
      expect(zombieOwner).to.equal(owner.address);
    });

    it("Should not allow creating two zombies", async () => {
      await cryptoZombies.createRandomZombie(zombieNames[0]);
      await expect(
        cryptoZombies.createRandomZombie(zombieNames[1])
      ).to.be.revertedWith("Should not have zombies to create a new one.");
    });

    it("Should not be able to change zombie name below level 2", async () => {
      await cryptoZombies.createRandomZombie(zombieNames[0]);
      await expect(
        cryptoZombies.changeName(firstZombieId, "newName")
      ).to.be.revertedWith("Zombie level is too low.");
    });

    it("Non owner should not be able to change zombie name", async () => {
      await cryptoZombies.createRandomZombie(zombieNames[0]);
      // Call levelUp because we cant change name if zombie level is 1
      await cryptoZombies.levelUp(firstZombieId, {
        value: ethers.utils.parseEther("0.0005"),
      });
      await expect(
        cryptoZombies.connect(alice).changeName(firstZombieId, "newName")
      ).to.be.revertedWith("Not owner of a zombie.");
    });

    it("Should be able to levelUp a zombie", async () => {
      await cryptoZombies.createRandomZombie(zombieNames[0]);
      await cryptoZombies.levelUp(firstZombieId, {
        value: ethers.utils.parseEther("0.0005"),
      });
      const zombieData = await cryptoZombies.zombies(firstZombieId);
      expect(zombieData.level).to.be.equal(2);
    });
  });

  describe("Feed & Multiply", function () {
    // calledOnContract matcher currently not supported by hardhat
    //
    // it("Should be able to set Kitty contract address", async () => {
    //   await cryptoZombies.setKittyContractAddress(kittyContractAddress);
    //   expect("setKittyContractAddress").to.be.calledOnContractWith(
    //     cryptoZombies,
    //     [kittyContractAddress]
    //   );
    // });

    it("Should create new zombie after feeding", async () => {
      await cryptoZombies.createRandomZombie(zombieNames[0]);
      // Increase the time by 1 day to skip cooldown after zombie creation
      await ethers.provider.send("evm_increaseTime", [86400]);

      await cryptoZombies.setKittyContractAddress(kittyContractAddress);
      const prevZombies = await cryptoZombies.ownerZombieCount(owner.address);
      await cryptoZombies.feedOnKitty(firstZombieId, testKittyId);
      const currZombies = await cryptoZombies.ownerZombieCount(owner.address);

      await expect(currZombies.toNumber() - prevZombies.toNumber()).to.be.equal(1);
    });

    it("Should not be able to feed when on cooldown", async () => {
      await cryptoZombies.createRandomZombie(zombieNames[0]);
      await cryptoZombies.setKittyContractAddress(kittyContractAddress);
      await expect(
        cryptoZombies.feedOnKitty(firstZombieId, testKittyId)
      ).to.be.revertedWith("Wait for cooldown to pass.");
    });

    it("Should not be able to feed on without setting Kitty contract address", async () => {
      await cryptoZombies.createRandomZombie(zombieNames[0]);
      await expect(cryptoZombies.feedOnKitty(firstZombieId, testKittyId)).to.be
        .reverted;
    });
  });

  describe("Battle system", function () {
    it("Should be able to change attackVictoryProbability", async () => {
      const newProb = 90;
      await cryptoZombies.setAttackVictoryProbability(newProb);
      const attackProb = await cryptoZombies.attackVictoryProbability();
      await expect(attackProb.toNumber()).to.be.equal(newProb);
    });

    it("Non owner cannot change attackVictoryProbability", async () => {
      const newProb = 90;
      await expect(
        cryptoZombies.connect(alice).setAttackVictoryProbability(newProb)
      ).to.be.reverted;
    });

    it("Zombie attack should emit event", async () => {
      await cryptoZombies.createRandomZombie(zombieNames[0]);
      await cryptoZombies.connect(alice).createRandomZombie(zombieNames[1]);

      // Increase the time by 1 day to skip cooldown after zombie creation
      await ethers.provider.send("evm_increaseTime", [86400]);

      await expect(cryptoZombies.attack(firstZombieId, secondZombieId))
        .to.emit(cryptoZombies, "Attack")
        .withArgs(owner.address, alice.address, firstZombieId, secondZombieId);
    });
  });

  describe("Zombie Token transfer", function () {
    describe("Single-step transfer scenario", function () {
      it("Should transfer a zombie", async () => {
        await cryptoZombies.createRandomZombie(zombieNames[0]);
        await cryptoZombies.transferFrom(
          owner.address,
          alice.address,
          firstZombieId
        );
        const newOwner = await cryptoZombies.ownerOf(firstZombieId);
        expect(newOwner).to.equal(alice.address);
      });
    });

    describe("Two-step transfer scenario", function () {
      it("Should approve and then transfer a zombie when the approved address calls transferFrom", async () => {
        await cryptoZombies.createRandomZombie(zombieNames[0]);
        await cryptoZombies.approve(alice.address, firstZombieId);
        await cryptoZombies
          .connect(alice)
          .transferFrom(owner.address, alice.address, firstZombieId);
        const newOwner = await cryptoZombies.ownerOf(firstZombieId);
        expect(newOwner).to.equal(alice.address);
      });
      it("Should approve and then transfer a zombie when the owner calls transferFrom", async () => {
        await cryptoZombies.createRandomZombie(zombieNames[0]);
        await cryptoZombies.approve(alice.address, firstZombieId);
        await cryptoZombies.transferFrom(
          owner.address,
          alice.address,
          firstZombieId
        );
        const newOwner = await cryptoZombies.ownerOf(firstZombieId);
        expect(newOwner).to.equal(alice.address);
      });
    });
  });
});

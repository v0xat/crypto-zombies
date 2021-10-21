import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

describe("CryptoZombies", function () {
  let kittyContractAddress: string;
  let cryptoZombies: Contract, cryptoKitties: Contract;
  let owner: SignerWithAddress, alice: SignerWithAddress;
  let addrs: SignerWithAddress[];

  // Define some test data to reduce code duplication
  const customDna = 13371337;
  const customName = "New Name";
  const customWinProb = 90;
  const dnaChangeLevel = 20;
  const defaultLevelUpFee = ethers.utils.parseEther("0.0005");
  const newLevelUpFee = ethers.utils.parseEther("1.5");
  const zombieNames = ["Stubbs", "Gary"];
  const firstZombieId = 0;
  const secondZombieId = 1;
  const testKittyId = 1;

  // Deploying KittyCore once because its used only in few tests
  before(async () => {
    [owner, alice, ...addrs] = await ethers.getSigners();
    const CryptoKitties = await ethers.getContractFactory("KittyCore");
    cryptoKitties = await CryptoKitties.deploy();
    await cryptoKitties.deployed();
    kittyContractAddress = cryptoKitties.address;

    // Creating a new cat to use it in further tests
    const kittyGene = 1337;
    await cryptoKitties.createPromoKitty(kittyGene, owner.address);
  });

  // Deploy contract before each test
  beforeEach(async () => {
    const CryptoZombies = await ethers.getContractFactory("CryptoZombies");
    cryptoZombies = await CryptoZombies.deploy();
    await cryptoZombies.deployed();
  });

  it("Should set the right owner", async () => {
    expect(await cryptoZombies.owner()).to.equal(owner.address);
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
  });

  describe("getZombiesByOwner", function () {
    it("Should return correct list of user zombies", async () => {
      await cryptoZombies.createRandomZombie(zombieNames[0]);
      const zombiesByOwner = await cryptoZombies.getZombiesByOwner(
        owner.address
      );
      expect(zombiesByOwner.length).to.be.equal(1);
      expect(zombiesByOwner[0]).to.be.equal(firstZombieId);
    });
  });

  describe("ownerOf", function () {
    it("Should return address of zombie owner", async () => {
      await cryptoZombies.createRandomZombie(zombieNames[0]);
      const zombieOwner = await cryptoZombies.ownerOf(firstZombieId);
      expect(zombieOwner).to.be.equal(owner.address);
    });
  });

  describe("balanceOf", function () {
    it("Should return correct zombie token balance", async () => {
      await cryptoZombies.createRandomZombie(zombieNames[0]);
      const ownerBalance = await cryptoZombies.balanceOf(owner.address);
      await expect(ownerBalance.toNumber()).to.be.equal(1);
    });
  });

  describe("Withdraw", function () {
    it("Non owner should not be able to call withdraw", async () => {
      await expect(cryptoZombies.connect(alice).withdraw()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("Withdraw works and changes owner balance", async () => {
      // Creating a zombie and increase its level to add some ether in contract
      await cryptoZombies.createRandomZombie(zombieNames[0]);
      await cryptoZombies.levelUp(firstZombieId, {
        value: defaultLevelUpFee,
      });

      // Withdraw ether from contract to its owner
      await expect(await cryptoZombies.withdraw()).to.changeEtherBalances(
        [cryptoZombies, owner],
        [-defaultLevelUpFee, defaultLevelUpFee]
      );
    });
  });

  describe("Change Name", function () {
    it("Should be able to change zombie name", async () => {
      await cryptoZombies.createRandomZombie(zombieNames[0]);
      // Call levelUp because we cant change name if zombie level is 1
      await cryptoZombies.levelUp(firstZombieId, {
        value: defaultLevelUpFee,
      });
      await cryptoZombies.changeName(firstZombieId, customName);
      const zombieData = await cryptoZombies.zombies(firstZombieId);
      expect(zombieData.name).to.be.equal(customName);
    });

    it("Should not be able to change zombie name below level 2", async () => {
      await cryptoZombies.createRandomZombie(zombieNames[0]);
      await expect(
        cryptoZombies.changeName(firstZombieId, customName)
      ).to.be.revertedWith("Zombie level is too low.");
    });

    it("Non owner should not be able to change zombie name", async () => {
      await cryptoZombies.createRandomZombie(zombieNames[0]);
      // Call levelUp because we cant change name if zombie level is 1
      await cryptoZombies.levelUp(firstZombieId, {
        value: defaultLevelUpFee,
      });
      await expect(
        cryptoZombies.connect(alice).changeName(firstZombieId, customName)
      ).to.be.revertedWith("Not owner of a zombie.");
    });
  });

  describe("Change DNA", function () {
    it("Should be able to change zombie dna", async () => {
      await cryptoZombies.createRandomZombie(zombieNames[0]);

      // Dna change available only on level 20
      for (let i = 1; i < dnaChangeLevel; i += 1) {
        await cryptoZombies.levelUp(firstZombieId, {
          value: defaultLevelUpFee,
        });
      }

      await cryptoZombies.changeDna(firstZombieId, customDna);
      const zombieData = await cryptoZombies.zombies(firstZombieId);
      expect(zombieData.dna).to.be.equal(customDna);
    });

    it("Should not be able to change zombie dna below level 20", async () => {
      await cryptoZombies.createRandomZombie(zombieNames[0]);

      await expect(
        cryptoZombies.changeName(firstZombieId, customDna)
      ).to.be.revertedWith("Zombie level is too low.");
    });

    it("Non owner should not be able to change zombie dna", async () => {
      await cryptoZombies.createRandomZombie(zombieNames[0]);

      // Dna change available only on level 20
      for (let i = 1; i < dnaChangeLevel; i += 1) {
        await cryptoZombies.levelUp(firstZombieId, {
          value: defaultLevelUpFee,
        });
      }

      await expect(
        cryptoZombies.connect(alice).changeDna(firstZombieId, customDna)
      ).to.be.revertedWith("Not owner of a zombie.");
    });
  });

  describe("Level Up", function () {
    it("levelUp should work and change contract & caller balances", async () => {
      await cryptoZombies.createRandomZombie(zombieNames[0]);

      // Zombie level changed
      const zombieBeforeUp = await cryptoZombies.zombies(firstZombieId);
      await cryptoZombies.levelUp(firstZombieId, {
        value: defaultLevelUpFee,
      });
      const zombieAfterUp = await cryptoZombies.zombies(firstZombieId);
      expect(zombieAfterUp.level).to.be.equal(zombieBeforeUp.level + 1);

      // Check levelUp changes balances
      await expect(
        await cryptoZombies.levelUp(firstZombieId, {
          value: defaultLevelUpFee,
        })
      ).to.changeEtherBalances(
        [cryptoZombies, owner],
        [defaultLevelUpFee, -defaultLevelUpFee]
      );
    });

    it("Should be able to set levelUp fee", async () => {
      await cryptoZombies.setLevelUpFee(newLevelUpFee);
      await expect(
        cryptoZombies.levelUp(firstZombieId, {
          value: defaultLevelUpFee,
        })
      ).to.be.revertedWith("Not enough ether.");
    });

    it("Should not be able to levelUp with insufficient ether", async () => {
      await cryptoZombies.createRandomZombie(zombieNames[0]);
      await expect(
        cryptoZombies.levelUp(firstZombieId, {
          value: ethers.utils.parseEther("0.00045"),
        })
      ).to.be.revertedWith("Not enough ether.");
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

      // Setting kitty contract address and feeding first created kitty
      await cryptoZombies.setKittyContractAddress(kittyContractAddress);
      const prevZombies = await cryptoZombies.ownerZombieCount(owner.address);
      await cryptoZombies.feedOnKitty(firstZombieId, testKittyId);
      const currZombies = await cryptoZombies.ownerZombieCount(owner.address);

      const expectedZombieChange = 1;
      await expect(currZombies.toNumber() - prevZombies.toNumber()).to.be.equal(
        expectedZombieChange
      );
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
      await cryptoZombies.setAttackVictoryProbability(customWinProb);
      const attackProb = await cryptoZombies.attackVictoryProbability();
      await expect(attackProb.toNumber()).to.be.equal(customWinProb);
    });

    it("Non owner cannot change attackVictoryProbability", async () => {
      await expect(
        cryptoZombies.connect(alice).setAttackVictoryProbability(customWinProb)
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
      it("Should change balances after transfer", async () => {
        await cryptoZombies.createRandomZombie(zombieNames[0]);
        await cryptoZombies.transferFrom(
          owner.address,
          alice.address,
          firstZombieId
        );
        const ownerBalance = await cryptoZombies.balanceOf(owner.address);
        await expect(ownerBalance.toNumber()).to.be.equal(0);
        const aliceBalance = await cryptoZombies.balanceOf(alice.address);
        await expect(aliceBalance.toNumber()).to.be.equal(1);
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

//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "./ZombieHelper.sol";

contract ZombieAttack is ZombieHelper {

  event Attack(address indexed attacker, address indexed defender, uint zombieId, uint targetId);

  uint public randNonce = 0;
  uint public attackVictoryProbability = 70;

  function setAttackVictoryProbability(uint _prob) external onlyOwner {
    attackVictoryProbability = _prob;
  }

  function randMod(uint _modulus) internal returns(uint) {
    randNonce++;
    return uint(keccak256(abi.encodePacked(block.timestamp, msg.sender, randNonce))) % _modulus;
  }

  function attack(uint _zombieId, uint _targetId) external onlyOwnerOf(_zombieId) {
    Zombie storage myZombie = zombies[_zombieId];
    Zombie storage enemyZombie = zombies[_targetId];
    uint rand = randMod(100);
    if (rand <= attackVictoryProbability) {
      myZombie.winCount++;
      myZombie.level++;
      enemyZombie.lossCount++;
      feedAndMultiply(_zombieId, enemyZombie.dna, "zombie");
    } else {
      myZombie.lossCount++;
      enemyZombie.winCount++;
      _triggerCooldown(myZombie);
    }
    emit Attack(zombieToOwner[_zombieId], zombieToOwner[_targetId], _zombieId, _targetId);
  }
}
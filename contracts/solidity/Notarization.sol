// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './oz/Ownable.sol';
import './oz/Pausable.sol';

contract Notarization is Ownable, Pausable{

    event hashEmitted(bytes32 indexed merkleRoot, uint indexed reqTimestamp);

    function pause() external onlyOwner {
          _pause();
      }
  
    function unpause() external onlyOwner {
        _unpause();
    }

    function emitHash(bytes32 merkleRoot, uint reqTimestamp) external onlyOwner whenNotPaused {
        emit hashEmitted(merkleRoot, reqTimestamp);
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './oz/Ownable.sol';
import './oz/IERC20.sol';

contract Stakeholder is Ownable { 

    // address of ERC20 token contract
    private IERC20 _selfBarToken;

    event TransferReceived(address from, uint amount);
    event TransferSent(address to, uint amount);

    constructor(address selfBarToken) {
        _selfBarToken = IERC20(selfBarToken);
    }

    receive() payable external {
      emit TransferReceived(msg.sender, msg.value);
    }

    function transfer(address to, uint256 amount) external onlyOwner {
        _selfBarToken.transfer(to, amount);
        emit TransferSent(to, amount);
    }
}
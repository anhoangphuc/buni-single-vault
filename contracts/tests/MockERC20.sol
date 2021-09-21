pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract MockERC20 is ERC20 {
    constructor(uint256 amount) public ERC20('MockERC20', 'ERC20') {
        _mint(msg.sender, amount);
    }
}
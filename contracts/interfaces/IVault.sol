//SPDX-License-Identifier: Unlicense
pragma solidity 0.6.12;
interface IVault {
    // Views
    function earned(address account) external view returns (uint256);

    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256); 

    // Mutative
    function stake(uint256 amount) external;

    function claim() external;
}
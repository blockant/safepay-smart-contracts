//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IERC20{
    function transferFrom(address from, address to, uint value) external;
    function approve(address spender, uint value) external;
    function transfer(address _to, uint _value) external;
}

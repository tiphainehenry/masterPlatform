// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./IoTNFT.sol";


struct Parameters {
    uint8 chainCurrencyDecimals; // Decimal of the token use
    Token token; // Token is the ioTNFT token
    address payable teamAddress; // This is the team wallet that will receive all funds
}

struct Token {
  string name; // Token name ex: Ethereum
  string symbol; // Token symbol ex: ETH
  string ipfsURI; // Token IPFS Uri
}

contract IoTNFTMinter {

   // Chain info and team wallet
  uint8 public immutable chainTokenDecimals;
  address payable public immutable teamAddress;
  IoTNFT public immutable token;



   constructor(Parameters memory params) {
  
      // We create the contract for the Token here
      token = new IoTNFT(this, params.token.name, params.token.symbol, params.token.ipfsURI);
      chainTokenDecimals = params.chainCurrencyDecimals;
      teamAddress = params.teamAddress;
    }

    function mintNFT() external payable {
        // Mint the token using the YounupNFT mint function
        token.mint(msg.sender);
        // We also transfer all the fund sent to the contract to the team wallet
        teamAddress.transfer(address(this).balance);
    }
}
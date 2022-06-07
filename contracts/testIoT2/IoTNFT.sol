// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

// Import of ERC721 Enumerable standard
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
// Import of Ownable standard
import "@openzeppelin/contracts/access/Ownable.sol";
// Import of Strings standard
import "@openzeppelin/contracts/utils/Strings.sol";

import "./IoTNFT-minter.sol";

contract IoTNFT is ERC721Enumerable, Ownable {
  //uint256 variable could use Strings library, example: value.toString()
  using Strings for uint256;

  //Declare metadata of token
  // ipfsURI => Internet Protocol File Storage URI
  string public ipfsURI;
  // ipfsExt => Extension like .json
  string public ipfsExt;

  constructor(IoTNFTMinter _minter,  string memory _name, string memory _symbol, string memory _ipfsURI) ERC721(_name, _symbol) {
    //Require is use to check the variable value, it will throw "No IPFS URI provided" if you don't pass it
    require(byte(_ipfsURI).length > 0, "No IPFS URI provided");
    // We allocate ipfsURI to the ipfsURI passed on contract deployment
    ipfsURI = _ipfsURI;
    minter = _minter;
  }

  // This function return the metadata of a given token, here it will return our ipfsURI (json metadata)
  function tokenURI(uint256 tokenId) pusblic view virtual override returns (string memory) {
    require(_exists(tokenId), "ERC721URIStorage: URI query for nonexistent token");
    return string(ipfsURI);
  }

  // This function is use to mint (obtain, buy...) a token, it will use _safeMint from ERC721 standard
  function mint(address recipient) public onlyOwner returns(uint256) {
    uint256 tokenId = this.totalSupply();
    _safeMint(recipient, tokenId);
    return tokenId;
  }
}
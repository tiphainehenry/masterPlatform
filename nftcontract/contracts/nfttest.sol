//Contract based on [https://docs.openzeppelin.com/contracts/3.x/erc721](https://docs.openzeppelin.com/contracts/3.x/erc721)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.5.0/contracts/token/ERC721/ERC721.sol";
// import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.5.0/contracts/utils/Counters.sol";
// import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.5.0/contracts/access/Ownable.sol";
// import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.5.0/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract NFTContract is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    struct Variable {
        // mapping(string => mapping(address => uint8)) matrix;
        // string[] activitiesKeys;
        // address[] rolesKeys;
        uint32 value;
        string name;
    }

    mapping(uint256 => Variable) variables;

    constructor() ERC721("IoTDevices", "IoT") {}

    function getVariable(uint256 _id) public view returns (Variable memory) {
        return variables[_id];
    }
 
    function getCounterCount() public view returns (uint256) {
        return _tokenIds.current();
    }

    function getAllTokens() public view returns (string[] memory) {
        uint256 nbOfTokens = _tokenIds.current();
        string[] memory toReturn = new string[](nbOfTokens);
        for (uint256 i = 0; i < nbOfTokens; i++) {
            toReturn[i] = super.tokenURI(i + 1);
        }
        return toReturn;
    }

    function mintNFT(
        address recipient,
        string memory tokenURI,
        string memory _name
    ) public returns (uint256) {
        _tokenIds.increment();

        uint256 newItemId = _tokenIds.current();
        Variable memory toadd = Variable({
            name: _name,
            value: 0
            // activitiesKeys: _activities,
            // rolesKeys: _roles
        });
        variables[newItemId] = toadd;
        _mint(recipient, newItemId);
        _setTokenURI(newItemId, tokenURI);

        return newItemId;
    }
}

pragma solidity ^0.4.24;

import "../../installed_contracts/ERC721/ERC721Token.sol";
import "../AdminIoTPoolManager.sol";

contract MyERC721 is ERC721Token {
    constructor (AdminIoTPoolManager _pool, string _symbol, string _authentificationKey) public
        ERC721Token(_name, _symbol, _pool, _authentificationKey)
    {
    }

    /**
    * Custom accessor to create a unique token
    */
    function mintUniqueTokenTo(
        address _to,
        uint256 _tokenId,
        string  _tokenURI
    ) public
    {
        super._mint(_to, _tokenId);
        super._setTokenURI(_tokenId, _tokenURI);
    }
}
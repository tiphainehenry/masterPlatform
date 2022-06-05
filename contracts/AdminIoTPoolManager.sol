pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

contract AdminIoTPoolManager {
    struct Pool {
        string name;
        bool isPool;
        string[] pools;
        mapping(string => bool) poolsMap;
    }

    mapping(address => Pool) public Pools;
    address[] poolList;

    constructor() public {
        address modAddress = 0x89033bC8f73Ef5b46CCb013f6F948b00954a06BB;
        newPool(modAddress, "TEMPÉRATURE");
        AddElemPool(modAddress, "temp1");
        AddElemPool(modAddress, "temp2");

       
    }

    function isPool(address PoolAddress) public view returns (bool isIndeed) {
        return Pools[PoolAddress].isPool;
    }

    function imPool() public view returns (string[] memory pool) {
        string[] memory pool = new string[](2);
        if (isPool(msg.sender)) {
            pool[0] = Pools[msg.sender].name;
            pool[1] = "qqc";
        } else {
            pool[0] = "Not registered";
            pool[1] = toAsciiString(msg.sender);
        }
        return pool;
    }

    function importAccount(address[] memory add, string[] memory pools) public {
        for (uint256 i = 0; i < add.length; i++) {
            if (!isPool(add[i])) {
                newPool(
                    add[i],
                    string(
                        abi.encodePacked(
                            "Account nbr:",
                            uint2str(poolList.length)
                        )
                    )
                );
                AddElemPool(add[i], pools[i]);
            } else {
                uint256 isPool = 0;
                for (uint256 j = 0; j < Pools[add[i]].pools.length; j++) {
                    if (Pools[add[i]].poolsMap[pools[j]] == true) {
                        isPool++;
                    }
                }
                if (isPool == 0) {
                    AddElemPool(add[i], pools[i]);
                }
            }
        }
    }

    function compareStringsbyBytes(string memory s1, string memory s2)
        public
        pure
        returns (bool)
    {
        return
            keccak256(abi.encodePacked(s1)) == keccak256(abi.encodePacked(s2));
    }

    function uint2str(uint256 _i)
        internal
        pure
        returns (string memory _uintAsString)
    {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len - 1;
        while (_i != 0) {
            bstr[k--] = byte(uint8(48 + (_i % 10)));
            _i /= 10;
        }
        return string(bstr);
    }

    function getPoolCount() public view returns (uint256 PoolCount) {
        return poolList.length;
    }

    function getName(address add) public view returns (string memory aze) {
        return Pools[add].name;
    }

    function getPools() public view returns (string[] memory list) {
        string[] memory listofPools = new string[](poolList.length);
        for (uint256 i = 0; i < poolList.length; i++) {
            listofPools[i] = string(
                abi.encodePacked(
                    Pools[poolList[i]].name,
                    "///",
                    toAsciiString(poolList[i]),
                    "///"
                )
            );
        }
        return listofPools;
    }


    function getAccountPools() public view returns (string[] memory list) {
        string[] memory listofPools = new string[](poolList.length);
        for (uint256 i = 0; i < poolList.length; i++) {
            for(uint256 j = 0; j < Pools[poolList[i]].pools.length; j++){
                listofPools[i] = string(
                    abi.encodePacked(
                        Pools[poolList[i]].pools[j],
                        "///",
                        toAsciiString(poolList[i])
                    )
                );
            }
        }
        return listofPools;
    }

    function getElemPools(address add)
        public
        view
        returns (string[] memory list)
    {
        if (!isPool(add)) revert();
        return Pools[add].pools;
    }

    function AddElemPool(address add, string memory newPool) public {
        Pools[add].pools.push(newPool);
        Pools[add].poolsMap[newPool] = true;
    }

    function RemoveElemPool(address add, uint256 i) public {
        uint256 lim = Pools[add].pools.length - 1;
        delete Pools[add].poolsMap[Pools[add].pools[i]];
        while (i < lim) {
            Pools[add].pools[i] = Pools[add].pools[i + 1];
            i++;
        }
        Pools[add].pools.length--;
    }

    function toAsciiString(address x) internal view returns (string memory) {
        bytes memory s = new bytes(40);
        for (uint256 i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint256(uint160(x)) / (2**(8 * (19 - i)))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            s[2 * i] = char(hi);
            s[2 * i + 1] = char(lo);
        }
        return string(s);
    }

    function char(bytes1 b) internal view returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }

    function newPool(
        address PoolAddress,
        string memory name
    ) public returns (string memory rowNumber) {
        if (isPool(PoolAddress)) revert();
        string[] memory tmpList = new string[](0);
        Pool memory tempStruct = Pool(name, true, tmpList);
        Pools[PoolAddress] = tempStruct;
        poolList.push(PoolAddress);
        return Pools[PoolAddress].name;
    }

    function updatePool(
        address PoolAddress,
        string memory name
    ) public returns (bool success) {
        if (!isPool(PoolAddress)) revert();
        Pools[PoolAddress].name = name;
        return true;
    }
}
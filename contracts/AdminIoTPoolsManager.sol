pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

contract AdminIoTPoolManager {
    struct IoTPool {
        string name;
        bool isIoTPool;
        string[] ioTPool;
        mapping(string => bool) ioTPoolMap;
    }

    mapping(address => IoTPool) public IoTPools;
    address[] ioTPoolList;

    constructor() public {
        address modAddress = 0x89033bC8f73Ef5b46CCb013f6F948b00954a06BB;
        newIoTPool(modAddress, "Alice", true);
        AddElemIoTPool(modAddress, "Florist");
        AddElemIoTPool(modAddress, "Tourist");

        address peonAddress1 = 0x1ED034135e576A6c1bf3ee8E05aaDEEF24D4A819;
        newIoTPool(peonAddress1, "Bob", false);
        AddElemIoTPool(peonAddress1, "Driver");
        AddElemIoTPool(peonAddress1, "TouristOfficer");

        address modAddress1 = 0x5AfBDd0e5DE3315a96504C06ac49bF34B5ECACB5;
        newIoTPool(modAddress1, "Carol", true);
        AddElemIoTPool(modAddress1, "Customer");
        AddElemIoTPool(modAddress1, "Restaurant");

        address modAddress2 = 0xC9f167B5056B03eB29963aB8e6F78bB12Cf5BA17;
        newIoTPool(modAddress2, "Dave", true);

        address modAddress3 = 0x2a706c6006e33610D92ea2a440Cc99d5b58353E1;
        newIoTPool(modAddress3, "Trent", true);

    }

    function isIoTPool(address IoTPoolAddress) public view returns (bool isIndeed) {
        return IoTPools[IoTPoolAddress].isIoTPool;
    }

    function imIoTPool() public view returns (string[] memory ioTPool) {
        string[] memory ioTPool = new string[](2);
        if (isIoTPool(msg.sender)) {
            ioTPool[0] = IoTPools[msg.sender].name;
        } else {
            ioTPool[0] = "Not registered";
            ioTPool[1] = toAsciiString(msg.sender);
        }
        return ioTPool;
    }

    function importAccount(address[] memory add, string[] memory ioTPool) public {
        for (uint256 i = 0; i < add.length; i++) {
            if (!isIoTPool(add[i])) {
                newIoTPool(
                    add[i],
                    string(
                        abi.encodePacked(
                            "Account nbr:",
                            uint2str(ioTPoolList.length)
                        )
                    ),
                    false
                );
                AddElemIoTPool(add[i], ioTPool[i]);
            } else {
                uint256 isIoTPool = 0;
                for (uint256 j = 0; j < IoTPools[add[i]].ioTPool.length; j++) {
                    if (IoTPools[add[i]].ioTPoolMap[ioTPool[j]] == true) {
                        isIoTPool++;
                    }
                }
                if (isIoTPool == 0) {
                    AddElemIoTPool(add[i], ioTPool[i]);
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

    function getIoTPoolCount() public view returns (uint256 IoTPoolCount) {
        return ioTPoolList.length;
    }

    function getName(address add) public view returns (string memory aze) {
        return IoTPools[add].name;
    }

    function getIoTPools() public view returns (string[] memory list) {
        string[] memory listofIoTPools = new string[](ioTPoolList.length);
        for (uint256 i = 0; i < ioTPoolList.length; i++) {
            listofIoTPools[i] = string(
                abi.encodePacked(
                    IoTPools[ioTPoolList[i]].name,
                    "///",
                    toAsciiString(ioTPoolList[i]),
                    "///",
                )
            );
        }
        return listofIoTPools;
    }


    function getAccountIoTPools() public view returns (string[] memory list) {
        string[] memory listofIoTPools = new string[](ioTPoolList.length);
        for (uint256 i = 0; i < ioTPoolList.length; i++) {
            for(uint256 j = 0; j < IoTPools[ioTPoolList[i]].ioTPool.length; j++){
                listofIoTPools[i] = string(
                    abi.encodePacked(
                        IoTPools[ioTPoolList[i]].ioTPool[j],
                        "///",
                        toAsciiString(ioTPoolList[i])
                    )
                );
            }
        }
        return listofIoTPools;
    }

    function getElemIoTPools(address add)
        public
        view
        returns (string[] memory list)
    {
        if (!isIoTPool(add)) revert();
        return IoTPools[add].ioTPool;
    }

    function AddElemIoTPool(address add, string memory newIoTPool) public {
        IoTPools[add].ioTPool.push(newIoTPool);
        IoTPools[add].ioTPoolMap[newIoTPool] = true;
    }

    function RemoveElemIoTPool(address add, uint256 i) public {
        uint256 lim = IoTPools[add].ioTPool.length - 1;
        delete IoTPools[add].ioTPoolMap[IoTPools[add].ioTPool[i]];
        while (i < lim) {
            IoTPools[add].ioTPool[i] = IoTPools[add].ioTPool[i + 1];
            i++;
        }
        IoTPools[add].ioTPool.length--;
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

    function newIoTPool(
        address IoTPoolAddress,
        string memory name,
    ) public returns (string memory rowNumber) {
        if (isIoTPool(IoTPoolAddress)) revert();
        string[] memory tmpList = new string[](0);
        IoTPool memory tempStruct = IoTPool(name, true,  tmpList);
        IoTPools[IoTPoolAddress] = tempStruct;
        ioTPoolList.push(IoTPoolAddress);
        return IoTPools[IoTPoolAddress].name;
    }

    function updateIoTPool(
        address IoTPoolAddress,
        string memory name,
    ) public returns (bool success) {
        if (!isIoTPool(IoTPoolAddress)) revert();
        IoTPools[IoTPoolAddress].name = name;
        return true;
    }
}

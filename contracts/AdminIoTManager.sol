pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;


import "filename" as symbolName;


contract AdminIoTManager {
    struct IoT {
        string name;
        struct IoTPool;
        bool isIoT;
        string[] ioT;
        mapping(string => bool) ioTMap;
    }

    mapping(address => IoT) public IoTs;
    address[] ioTList;

    constructor() public {
        address modAddress = 0x89033bC8f73Ef5b46CCb013f6F948b00954a06BB;
        newIoT(modAddress, "temperature")
        AddElemIoT(modAddress, "Localisation");

    }

    function isIoT(address IoTAddress) public view returns (bool isIndeed) {
        return IoTs[IoTAddress].isIoT;
    }

    function imIoT() public view returns (string[] memory ioT) {
        string[] memory ioT = new string[](2);
        if (isIoT(msg.sender)) {
            ioT[0] = IoTs[msg.sender].name;
        } else {
            ioT[0] = "Not registered";
            ioT[1] = toAsciiString(msg.sender);
        }
        return ioT;
    }

    function importAccount(address[] memory add, string[] memory ioT) public {
        for (uint256 i = 0; i < add.length; i++) {
            if (!isIoT(add[i])) {
                newIoT(
                    add[i],
                    string(
                        abi.encodePacked(
                            "Account nbr:",
                            uint2str(ioTList.length)
                        )
                    ),
                    false
                );
                AddElemIoT(add[i], ioT[i]);
            } else {
                uint256 isIoT = 0;
                for (uint256 j = 0; j < IoTs[add[i]].ioT.length; j++) {
                    if (IoTs[add[i]].ioTMap[ioT[j]] == true) {
                        isIoT++;
                    }
                }
                if (isIoT == 0) {
                    AddElemIoT(add[i], ioT[i]);
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

    function getIoTCount() public view returns (uint256 IoTCount) {
        return ioTList.length;
    }

    function getName(address addr) public view returns (string memory aze) {
        return IoTs[addr].name;
    }

    function getIoTs() public view returns (string[] memory list) {
        string[] memory listofIoTs = new string[](ioTList.length);
        for (uint256 i = 0; i < ioTList.length; i++) {
            listofIoTs[i] = string(
                abi.encodePacked(
                    IoTs[ioTList[i]].name,
                    "///",
                    toAsciiString(ioTList[i]),
                    "///",
                )
            );
        }
        return listofIoTs;
    }


    function getElemIoTs(address address)
        public
        view
        returns (string[] memory list)
    {
        if (!isIoT(address)) revert();
        return IoTs[address].ioT;
    }

    function AddElemIoT(address add, string memory newIoT) public {
        IoTs[add].ioT.push(newIoT);
        IoTs[add].ioTMap[newIoT] = true;
    }

    function RemoveElemIoT(address addr, uint256 i) public {
        uint256 lim = IoTs[addr].ioT.length - 1;
        delete IoTs[addr].ioTMap[IoTs[addr].ioT[i]];
        while (i < lim) {
            IoTs[addr].ioT[i] = IoTs[addr].ioT[i + 1];
            i++;
        }
        IoTs[add].ioT.length--;
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

    function newIoT(
        address IoTAddress,
        string memory name,
    ) public returns (string memory rowNumber) {
        if (isIoT(IoTAddress)) revert();
        string[] memory tmpList = new string[](0);
        IoT memory tempStruct = IoT(name, true,  tmpList);
        IoTs[IoTAddress] = tempStruct;
        ioTList.push(IoTAddress);
        return IoTs[IoTAddress].name;
    }

    function updateIoT(
        address IoTAddress,
        string memory name,
    ) public returns (bool success) {
        if (!isIoT(IoTAddress)) revert();
        IoTs[IoTAddress].name = name;
        return true;
    }
}

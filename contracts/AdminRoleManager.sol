pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

contract AdminRoleManager {
    struct Role {
        string name;
        bool isRole;
        bool isAdmin;
        string[] roles;
        mapping(string => bool) rolesMap;
    }

    mapping(address => Role) public Roles;
    address[] roleList;

    constructor() public {
        address modAddress = 0x89033bC8f73Ef5b46CCb013f6F948b00954a06BB;
        newRole(modAddress, "Alice", true);
        AddElemRole(modAddress, "Florist");

        address peonAddress1 = 0x1ED034135e576A6c1bf3ee8E05aaDEEF24D4A819;
        newRole(peonAddress1, "Bob", false);
        AddElemRole(peonAddress1, "Driver");

        address modAddress1 = 0x5AfBDd0e5DE3315a96504C06ac49bF34B5ECACB5;
        newRole(modAddress1, "Carol", true);
        AddElemRole(modAddress1, "Customer");

        address modAddress2 = 0xC9f167B5056B03eB29963aB8e6F78bB12Cf5BA17;
        newRole(modAddress2, "Dave", true);

        address modAddress3 = 0x2a706c6006e33610D92ea2a440Cc99d5b58353E1;
        newRole(modAddress3, "Trent", true);

    }

    function isRole(address RoleAddress) public view returns (bool isIndeed) {
        return Roles[RoleAddress].isRole;
    }

    function imRole() public view returns (string[] memory role) {
        string[] memory role = new string[](2);
        if (isRole(msg.sender)) {
            role[0] = Roles[msg.sender].name;
            role[1] = Roles[msg.sender].isAdmin ? "true" : "false";
        } else {
            role[0] = "Not registered";
            role[1] = toAsciiString(msg.sender);
        }
        return role;
    }

    function importAccount(address[] memory add, string[] memory roles) public {
        for (uint256 i = 0; i < add.length; i++) {
            if (!isRole(add[i])) {
                newRole(
                    add[i],
                    string(
                        abi.encodePacked(
                            "Account nbr:",
                            uint2str(roleList.length)
                        )
                    ),
                    false
                );
                AddElemRole(add[i], roles[i]);
            } else {
                uint256 isRole = 0;
                for (uint256 j = 0; j < Roles[add[i]].roles.length; j++) {
                    if (Roles[add[i]].rolesMap[roles[j]] == true) {
                        isRole++;
                    }
                }
                if (isRole == 0) {
                    AddElemRole(add[i], roles[i]);
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

    function getRoleCount() public view returns (uint256 RoleCount) {
        return roleList.length;
    }

    function getName(address add) public view returns (string memory aze) {
        return Roles[add].name;
    }

    function getRoles() public view returns (string[] memory list) {
        string[] memory listofRoles = new string[](roleList.length);
        for (uint256 i = 0; i < roleList.length; i++) {
            listofRoles[i] = string(
                abi.encodePacked(
                    Roles[roleList[i]].name,
                    "///",
                    toAsciiString(roleList[i]),
                    "///",
                    (Roles[roleList[i]].isAdmin ? "true" : "false")
                )
            );
        }
        return listofRoles;
    }


    function getAccountRoles() public view returns (string[] memory list) {
        string[] memory listofRoles = new string[](roleList.length);
        for (uint256 i = 0; i < roleList.length; i++) {
            for(uint256 j = 0; j < Roles[roleList[i]].roles.length; j++){
                listofRoles[i] = string(
                    abi.encodePacked(
                        Roles[roleList[i]].roles[j],
                        "///",
                        toAsciiString(roleList[i])
                    )
                );
            }
        }
        return listofRoles;
    }

    function getElemRoles(address add)
        public
        view
        returns (string[] memory list)
    {
        if (!isRole(add)) revert();
        return Roles[add].roles;
    }

    function AddElemRole(address add, string memory newRole) public {
        Roles[add].roles.push(newRole);
        Roles[add].rolesMap[newRole] = true;
    }

    function RemoveElemRole(address add, uint256 i) public {
        uint256 lim = Roles[add].roles.length - 1;
        delete Roles[add].rolesMap[Roles[add].roles[i]];
        while (i < lim) {
            Roles[add].roles[i] = Roles[add].roles[i + 1];
            i++;
        }
        Roles[add].roles.length--;
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

    function newRole(
        address RoleAddress,
        string memory name,
        bool isAdmin
    ) public returns (string memory rowNumber) {
        if (isRole(RoleAddress)) revert();
        string[] memory tmpList = new string[](0);
        Role memory tempStruct = Role(name, true, isAdmin, tmpList);
        Roles[RoleAddress] = tempStruct;
        roleList.push(RoleAddress);
        return Roles[RoleAddress].name;
    }

    function updateRole(
        address RoleAddress,
        string memory name,
        bool Admin
    ) public returns (bool success) {
        if (!isRole(RoleAddress)) revert();
        Roles[RoleAddress].name = name;
        Roles[RoleAddress].isAdmin = Admin;
        return true;
    }
}

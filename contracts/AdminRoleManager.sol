pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

contract AdminRoleManager {
    struct Role {
        string name;
        bool isRole;
        bool isAdmin;
    }

    mapping(address => Role) public Roles;
    address[] roleList;

    constructor() public {
        address modAddress = 0x1D27B15fEbF8dce6fe0Fd5B45A4784C4dD3e11e1;
        newRole(modAddress, "first account", true);
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
                    (Roles[roleList[i]].isAdmin ? "true" :"false")
                )
            );
        }
        return listofRoles;
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
        Role memory tempStruct = Role(name, true, isAdmin);
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

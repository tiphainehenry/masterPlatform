pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

contract AdminRoleManager {
    struct Role {
        string name;
        bool isRole;
    }

    mapping(address => Role) public Roles;
    address[] public roleList;

    function isRole(address RoleAddress) public view returns (bool isIndeed) {
        return Roles[RoleAddress].isRole;
    }

    function getRoleCount() public view returns (uint256 RoleCount) {
        return roleList.length;
    }


    function getName(address add) public view returns (string memory aze) {
        string memory aze = Roles[add].name;
        return aze;
    }

    function getRoles() public view returns (string[] memory list) {
        string[] memory listofRoles = new string[](roleList.length);
        for (uint256 i = 0; i < roleList.length; i++) {
            listofRoles[i] = Roles[roleList[i]].name;
        }
        return listofRoles;
    }

    function newRole(address RoleAddress, string memory name)
        public
        returns (uint256 rowNumber)
    {
        if (isRole(RoleAddress)) revert();
        // if (isRole(RoleAddress))
        //     return 1;
        // else
        //     return 2;
        Role memory tempStruct = Role(name, true);
        Roles[RoleAddress] = tempStruct;
        roleList.push(RoleAddress);
        return roleList.length + 100;
    }

    function updateRole(address RoleAddress, string memory name)
        public
        returns (bool success)
    {
        if (!isRole(RoleAddress)) revert();
        Roles[RoleAddress].name = name;
        return true;
    }
}

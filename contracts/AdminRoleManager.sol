pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

contract AdminRoleManager {
    struct Role {
    string name;
    bool isRole;
  }

  mapping(address => Role) public Roles;
  address[] public roleList;

  function isRole(address RoleAddress) public view returns(bool isIndeed) {
      return Roles[RoleAddress].isRole;
  }

  function getRoleCount() public view returns(uint RoleCount) {
    return roleList.length;
  }

  function newRole(address RoleAddress, string memory name) public returns(uint rowNumber) {
    if(isRole(RoleAddress)) revert();
    Roles[RoleAddress].name = name;
    return roleList.push(RoleAddress) - 1;
  }

  function updateRole(address RoleAddress, string memory name) public returns(bool success) {
    if(!isRole(RoleAddress)) revert();
    Roles[RoleAddress].name  = name;
    return true;
  }
}
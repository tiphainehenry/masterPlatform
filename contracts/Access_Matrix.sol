pragma solidity ^0.5.16;


contract Access_matrix {
    mapping(string => mapping(address => uint8)) matrix;

    function updateMatrix(string memory _activity, address _role, uint8 _val) public {
      matrix[_activity][_role] = _val;
    }
}
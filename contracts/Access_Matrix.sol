pragma solidity ^0.5.16;

import "hardhat/console.sol";

contract Access_matrix {
    mapping(string => mapping(address => uint8)) matrix;
    uint32 variable;

    /** @dev Update an entry of the access matrix
      * @param _activity is the name of the activity 
      * @param _role is the role
      * @param _val is a 4 bit int that allows to find if a certain matrix entry has access or not to a vraiable (read,write,create,delete) are the four bits.
      * @return 
      */
    function updateMatrix(string memory _activity, address _role, uint8 _val) public {
      matrix[_activity][_role] = _val;
    }

    /** @dev Update the variable value if the caller has access
      * @param _variable_value new variable value 
      * @param _activity name of the activity that want to update the variable value
      * @return 
      */
    function updateValue(uint32 _variable_value, string memory _activity) public {
        bool has_access = (matrix[_activity][msg.sender] >> 3 ) & 1 == 1;
        assert(has_access);
        variable = _variable_value;
    }

    /** @dev Get the variable value
      * @return _var the variable value 
      */
    function getVariableValue() public view returns (uint32 _var){
        return variable;
    }

    /** @dev deletes the contract if the caller has the authorization (first bit starting from right).
      * @param _activity that want to have access
      * @return 
      */
    function deleteVariable(string memory _activity) public {
        bool has_access = (matrix[_activity][msg.sender]) & 1 == 1;
        assert(has_access);
        selfdestruct(msg.sender);
    }
}
pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

// import "hardhat/console.sol";

contract Access_matrix {
  struct Variable {
    mapping(string => mapping(address => uint8)) matrix;
    string[] activitiesKeys;
    address[] rolesKeys;
    uint32 value;
    string name;
  }


  mapping(string => Variable[]) variables;

    /** @dev Update an entry of the access matrix
      * @param _activity is the name of the activity 
      * @param _role is the role
      * @param _val is a 4 bit int that allows to find if a certain matrix entry has access or not to a vraiable (read,write,create,delete) are the four bits.
      * @return 
      */
    function updateMatrix(string memory _hash, uint index, string memory _activity, address _role, uint8 _val) public {
      variables[_hash][index].matrix[_activity][_role] = _val;
    }

    function setVariableName(string memory _hash, uint index, string memory _newName) public {
      variables[_hash][index].name = _newName;
    }

    function getVariableName(string memory _hash, uint index) public view returns (string memory _varName) {
      return variables[_hash][index].name;
    }

    function uploadMatrix(string memory _hash, string memory _newName, string[] memory _activities, address[] memory _roles, uint8[] memory _vals, uint nbOfElements) public {
      Variable memory topush = Variable( {
        name : _newName,
        value: 0,
        activitiesKeys : _activities,
        rolesKeys: _roles
      });
      variables[_hash].push(topush);
      for(uint k = 0; k < nbOfElements; k++) {
        variables[_hash][variables[_hash].length - 1].matrix[_activities[k]][_roles[k]] = _vals[k]; 
      }
    }

    /** @dev Update the variable value if the caller has access
      * @param _variable_value new variable value 
      * @param _activity name of the activity that want to update the variable value
      * @return 
      */
    function updateValue(string memory _hash, uint index, uint32 _variable_value, string memory _activity) public {
        bool has_access = (variables[_hash][index].matrix[_activity][msg.sender] >> 2 ) & 1 == 1;
        assert(has_access);
        variables[_hash][index].value = _variable_value;
    }

    /** @dev Get the variable value
      * @return _var the variable value 
      */
    function getVariableValue(string memory _hash, uint index) public view returns (uint32 _var){
        return variables[_hash][index].value;
    }

    function getAllVariables(string memory _hash) public view returns (string[] memory,  uint32[] memory){
      string[] memory arr = new string[](variables[_hash].length);
      uint32[] memory vls = new uint32[](variables[_hash].length);
      for(uint i = 0; i < variables[_hash].length; i++) {
        arr[i] = (variables[_hash][i].name);
        vls[i] = (variables[_hash][i].value);
      }
      return (arr, vls);
    }

    function getActivites(string memory _hash, uint index) public view returns (string[] memory) {
      return variables[_hash][index].activitiesKeys;
    }

    function getRoles(string memory _hash, uint index) public view returns (address[] memory) {
      return variables[_hash][index].rolesKeys;
    }

    function getAccess(string memory _hash, uint index, string memory _activity, address _role) public view returns (uint8 _access) {
      return  variables[_hash][index].matrix[_activity][_role];
    }

    /** @dev deletes the contract if the caller has the authorization (first bit starting from right).
      * @param _activity that want to have access
      * @return 
      */
    function deleteVariable(string memory _hash, uint index, string memory _activity) public {
        // bool has_access = (variables[_hash][index].matrix[_activity][msg.sender]) & 1 == 1;
        // assert(has_access);
        selfdestruct(msg.sender);
    }
}
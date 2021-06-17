//pragma solidity 0.5.10;
pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

contract PublicDCRManager {
    // event declaration
    event LogWorkflowCreation(
        string indexed workflowHash,
        address indexed creator
    );

    event LogExecution(
        string indexed workflowHash,
        uint256 indexed activityId,
        address indexed executor
    );

    event LogWorkflowProjection(
        string indexed workflowHash,
        address indexed creator
    );
    
    
    event RequestChange(
        string indexed newWorkflowHash,
        address indexed endorser
    );


    // variable declarations.

    struct Workflow {
        string name;
        string ipfsViewHash;

        Marking markings;
        address[] roleAddresses;
        string[] activityNames;
        bytes[] ipfsActivityHashes;
        uint256 numActivities; //number of included activities
        uint256[][][] relations; //includesTo, excludesTo, responsesTo, conditionsFrom, milestonesFrom
        
        //uint256[][] excludesTo;
        //uint256[][] responsesTo;
        //uint256[][] conditionsFrom;
        //uint256[][] milestonesFrom;
        
        //ApprovalList approvalList;
        address[] approvalAddresses;
        uint[] approvalOutcomes;
        uint[] didFetch;

        Activity execStatus;
    }
    
    struct Marking {
        uint256[] included;
        uint256[] executed;
        uint256[] pending;
    }

    struct Activity {
        uint32 canExecuteCheck;
        uint256 status; //0=no, 1=yes
    }
    
    string[] registeredViewHashes;

    mapping(string => Workflow) workflows;

    ///////////////// Misc ////////////////////////

    function getAllWKHashes() public view returns (string[] memory){
        return registeredViewHashes;
    }


    function sendHash(string memory _hash, string memory x) public {
        workflows[_hash].ipfsViewHash = x;
    }

    function getHash(string memory _hash) public view returns (string memory x) {
        return workflows[_hash].ipfsViewHash;
    }

    /** @dev Getter for workflow.
      * @param _hash index of the workflow (eg 0 for the first workflow).
      * @param myAddress sender adddress (must be registered to fetch the workflow).
      * @return workflow, update didFetch variable to one.
      */
    function fetchPublicView(string memory _hash, address myAddress)
        public
        payable
        returns (string memory)
    {
        
        require(msg.sender == myAddress, 'wrongAddress');
        
        // update the didFetch variable
        for (
            uint256 id = 0;
            id < workflows[_hash].approvalAddresses.length;
            id++
        ) {
            if((myAddress == workflows[_hash].approvalAddresses[id]) && workflows[_hash].didFetch[id] != 1){
                workflows[_hash].didFetch[id] = 1;
                }
        }
        
        return workflows[_hash].ipfsViewHash;
    }
    
    
    function requestChange(address[] memory toNotify, string memory _hash) public{
        for (
            uint256 id = 0;
            id < toNotify.length;
            id++
        ) {
            
            emit RequestChange(_hash,toNotify[id]);
        }
    }
     
    /** @dev Getter for workflow name.
      * @param _hash index of the workflow (eg 0 for the first workflow).
      * @return workflow name.
      */

    function getWorkflowName(string memory _hash)
        public
        view
        returns (string memory)
    {
        return workflows[_hash].name;
    }

    /** @dev Getter for workflow execution status.
      * @param _hash index of the workflow (eg 0 for the first workflow).
      * @return execution status of the task: 0=ok, 1= 
      */
    function getCanExecuteCheck(string memory _hash, uint256 activityId)
        public
        view
        returns (uint32)
    {
        return workflows[_hash].execStatus.canExecuteCheck;
    }

    function getStatus(string memory _hash, uint256 activityId)
        public
        view
        returns (uint256)
    {
        return workflows[_hash].execStatus.status;
    }

    function getWkfLength(string memory _hash) public view returns (uint256) {
        return workflows[_hash].relations[0].length;
    }

    function getIncluded(string memory _hash)
        public
        view
        returns (uint256[] memory)
    {
        return workflows[_hash].markings.included;
    }

    function getExecuted(string memory _hash)
        public
        view
        returns (uint256[] memory)
    {
        return workflows[_hash].markings.executed;
    }

    function getPending(string memory _hash)
        public
        view
        returns (uint256[] memory)
    {
        return workflows[_hash].markings.pending;
    }

    function getConditionsFrom(string memory _hash)
        public
        view
        returns (uint256[][] memory)
    {
        return workflows[_hash].relations[3];
    }

    function getHashes(string memory _hash)
        public
        view
        returns (bytes[] memory)
    {
        return workflows[_hash].ipfsActivityHashes;
    }

    function getActivityName(string memory _hash, uint256 activityId)
        public
        view
        returns (string memory)
    {
        return workflows[_hash].activityNames[activityId];
    }

    function getRoleAddresses(string memory _hash, uint256 activityId)
        public
        view
        returns (address)
    {
        return workflows[_hash].roleAddresses[activityId];
    }

    function getAddresses(string memory _hash)
        public
        view
        returns (address[] memory)
    {
        return workflows[_hash].approvalAddresses;
    }


    function getApprovalsOutcome(string memory _hash)
        public
        view
        returns (uint[] memory)
    {
        return (workflows[_hash].approvalOutcomes);
    }

    function hasApproved(string memory _hash, address myAddress)
        public
        view
        returns (uint)
    {
        //uint res = 0;
        for (
            uint256 id = 0;
            id < workflows[_hash].approvalAddresses.length;
            id++
        ) {
            if((myAddress == workflows[_hash].approvalAddresses[id]) && workflows[_hash].approvalOutcomes[id] == 1){
                return 1;
            }
        }
        return 0;
    }

    ///////////////// Utils /////////////////////////

    function canExecute(string memory _hash, uint256 activityId, address msgSender)
        public
        returns (bool)
    {
        // check if msg.sender address is correct
        if (msgSender != workflows[_hash].roleAddresses[activityId]) {
            workflows[_hash].execStatus.canExecuteCheck = 4;
            return false;
        }
        
        // activity must be included
        if (workflows[_hash].markings.included[activityId] == 0) {
            workflows[_hash].execStatus.canExecuteCheck = 1;
            return false;
        }

        // all conditions executed
        for (
            uint256 id = 0;
            id < workflows[_hash].relations[3].length;
            id++
        ) {
            uint256[] memory conditionsRow =
                workflows[_hash].relations[3][id];
            if (conditionsRow[activityId] == 1) {
                if (
                    (workflows[_hash].markings.executed[id] == 0) &&
                    (workflows[_hash].markings.included[id] == 1)
                ) {
                    workflows[_hash].execStatus.canExecuteCheck = 2;
                    return false;
                }
            }
        }

        // no milestones pending
        for (
            uint256 id = 0;
            id < workflows[_hash].relations[4].length; // milestonesFrom
            id++
        ) {
            uint256[] memory milestonesRow =
                workflows[_hash].relations[4][id];
            if (milestonesRow[activityId] == 1) {
                if (
                    (workflows[_hash].markings.pending[id] == 1) &&
                    (workflows[_hash].markings.included[id] == 1)
                ) {
                    workflows[_hash].execStatus.canExecuteCheck = 3;
                    return false;
                }
            }
        }

        workflows[_hash].execStatus.canExecuteCheck = 0;
        return true;
    }

    ///////////////// Main functions /////////////////////////
    function checkCliquedIndex(string memory _hash, uint256 activityId)
        public
    //        bytes memory ipfsHash
    {
        if (!canExecute(_hash, activityId, msg.sender)) {
            workflows[_hash].execStatus.status = 1;
            //revert();
        } else {
            // executed activity
            workflows[_hash].markings.executed[activityId] = 1;
            workflows[_hash].markings.pending[activityId] = 0;
            //            workflows[workflowId].ipfsActivityHashes[activityId] = ipfsHash;

            uint256[] memory exclude_vect_check =
                workflows[_hash].relations[1][activityId]; // excludes
            uint256[] memory response_vect_check =
                workflows[_hash].relations[2][activityId]; // responsesTo

            // add include relations
            uint256[] memory include_vect_check =
                workflows[_hash].relations[0][activityId]; // includes

            // update with condition relations ok
            uint256[] memory conditionsTo =
                workflows[_hash].relations[3][activityId]; //extract row condition
            for (uint256 id = 0; id < conditionsTo.length; id++) {
                if (conditionsTo[id] == 1) {
                    include_vect_check[id] = 1;
                }
            }

            for (
                uint256 id = 0;
                id < workflows[_hash].relations[1].length; // excludesTo
                id++
            ) {
                // exclude and include relations pass
                // note includes happens after the exclude pass
                // included = (included & ~excludesTo[activityId]) | includesTo[activityId];
                if (
                    (exclude_vect_check[id] != 1) &&
                    (include_vect_check[id] == 1)
                ) {
                    workflows[_hash].markings.included[id] = 1;
                }

                // response relations pass
                // pending = (pending | responsesTo[activityId]);
                if (response_vect_check[id] == 1) {
                    workflows[_hash].markings.pending[id] = 1;
                    workflows[_hash].markings.included[id] = 1;
                }
            }

            emit LogExecution(_hash, activityId, msg.sender);

            workflows[_hash].execStatus.status = 1;
        }
    }

    function uploadPublicView(
        // packed state variables
        uint256[][] memory markingStates, // included, executed, pending

        string memory _ipfsViewHash,

        //process information
        address[] memory _roleAddresses,
        address[] memory _approvalAddresses,

        string[] memory _activityNames,
        string memory _name,

        // relations
        uint256[][][] memory _relations // includesto, excludesto, responsesto, conditionsfrom, milestonesFrom
    ) public payable {
        
        Activity memory execStatus = Activity(0, 0);
        Marking memory markings = Marking(markingStates[0],markingStates[1],markingStates[2]);
        Workflow memory wf =
            Workflow(
                _name,
                _ipfsViewHash,
                markings,
                _roleAddresses,
                _activityNames,
                new bytes[](markingStates[0].length),
                markingStates[0].length,
                _relations,
                _approvalAddresses,
                new uint[](_approvalAddresses.length),
                new uint[](_approvalAddresses.length),
                execStatus
            );
        workflows[_ipfsViewHash]=wf;

        registeredViewHashes.push(_ipfsViewHash);


        emit LogWorkflowCreation(wf.ipfsViewHash, msg.sender);
    }

    /** @dev post private projection approval function.
      * @param _hash index of the workflow (eg 0 for the first workflow).
      * @param myAddress address of the sender (necessary for web3js dev).
      * @return list of approval outcomes.
      */
    function confirmProjection(string memory _hash, address myAddress) public payable returns (uint[] memory){
        // get id of approvalList.addresses corresponding to msgSender. If (approval[id]==0): set to one;
        
        require(myAddress==msg.sender, "Must be role owner.");

        for (
            uint256 id = 0;
            id < workflows[_hash].approvalAddresses.length;
            id++
        ) {
            if((myAddress == workflows[_hash].approvalAddresses[id]) && workflows[_hash].didFetch[id] == 1){ // must have fetched public view
                if(workflows[_hash].approvalOutcomes[id] != 1){ // must not have approved before
                    workflows[_hash].approvalOutcomes[id] = 1;
                    emit LogWorkflowProjection(_hash, myAddress);
                    return workflows[_hash].approvalOutcomes;
                }
            }

        }
        
        return workflows[_hash].approvalOutcomes;
        
    }  


}

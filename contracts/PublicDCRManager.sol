//pragma solidity 0.5.10;
pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

contract PublicDCRManager {
    // event declaration
    event LogWorkflowCreation(
        uint256 indexed workflowId,
        string indexed workflowName,
        address indexed creator
    );

    event LogExecution(
        uint256 indexed workflowId,
        uint256 indexed activityId,
        address indexed executor
    );

    event LogWorkflowProjection(
        uint256 indexed workflowId,
        address indexed creator
    );

    // variable declarations.
    string ipfsHash;

    struct Workflow {
        string name;
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
    

    Workflow[] workflows;
    
    

    ///////////////// Misc ////////////////////////

    function sendHash(string memory x) public {
        ipfsHash = x;
    }

    function getHash() public view returns (string memory x) {
        return ipfsHash;
    }


    /** @dev Getter for workflow.
      * @param workflowId index of the workflow (eg 0 for the first workflow).
      * @param myAddress sender adddress (must be registered to fetch the workflow).
      * @return workflow, update didFetch variable to one.
      */
    function fetchPublicView(uint256 workflowId, address myAddress)
        public
        payable
        returns (Workflow memory)
    {
        
        require(msg.sender == myAddress, 'wrongAddress');
        
        // update the didFetch variable
        for (
            uint256 id = 0;
            id < workflows[workflowId].approvalAddresses.length;
            id++
        ) {
            if((myAddress == workflows[workflowId].approvalAddresses[id]) && workflows[workflowId].didFetch[id] != 1){
                workflows[workflowId].didFetch[id] = 1;
                }
        }
        
        return workflows[workflowId];
    }

     
    /** @dev Getter for workflow name.
      * @param workflowId index of the workflow (eg 0 for the first workflow).
      * @return workflow name.
      */

    function getWorkflowName(uint256 workflowId)
        public
        view
        returns (string memory)
    {
        return workflows[workflowId].name;
    }

    /** @dev Getter for workflow execution status.
      * @param workflowId index of the workflow (eg 0 for the first workflow).
      * @return execution status of the task: 0=ok, 1= 
      */
    function getCanExecuteCheck(uint256 workflowId, uint256 activityId)
        public
        view
        returns (uint32)
    {
        return workflows[workflowId].execStatus.canExecuteCheck;
    }

    function getStatus(uint256 workflowId, uint256 activityId)
        public
        view
        returns (uint256)
    {
        return workflows[workflowId].execStatus.status;
    }

    function getWkfLength(uint256 workflowId) public view returns (uint256) {
        return workflows[workflowId].relations[0].length;
    }

    function getIncluded(uint256 workflowId)
        public
        view
        returns (uint256[] memory)
    {
        return workflows[workflowId].markings.included;
    }

    function getExecuted(uint256 workflowId)
        public
        view
        returns (uint256[] memory)
    {
        return workflows[workflowId].markings.executed;
    }

    function getPending(uint256 workflowId)
        public
        view
        returns (uint256[] memory)
    {
        return workflows[workflowId].markings.pending;
    }

    function getConditionsFrom(uint256 workflowId)
        public
        view
        returns (uint256[][] memory)
    {
        return workflows[workflowId].relations[3];
    }

    function getHashes(uint256 workflowId)
        public
        view
        returns (bytes[] memory)
    {
        return workflows[workflowId].ipfsActivityHashes;
    }

    function getActivityName(uint256 workflowId, uint256 activityId)
        public
        view
        returns (string memory)
    {
        return workflows[workflowId].activityNames[activityId];
    }

    function getRoleAddresses(uint256 workflowId, uint256 activityId)
        public
        view
        returns (address)
    {
        return workflows[workflowId].roleAddresses[activityId];
    }

    function getAddresses(uint256 workflowId)
        public
        view
        returns (address[] memory)
    {
        return workflows[workflowId].approvalAddresses;
    }


    function getApprovalsOutcome(uint256 workflowId)
        public
        view
        returns (uint[] memory)
    {
        return (workflows[workflowId].approvalOutcomes);
    }

    function hasApproved(uint256 workflowId, address myAddress)
        public
        view
        returns (uint)
    {
        //uint res = 0;
        for (
            uint256 id = 0;
            id < workflows[workflowId].approvalAddresses.length;
            id++
        ) {
            if((myAddress == workflows[workflowId].approvalAddresses[id]) && workflows[workflowId].approvalOutcomes[id] == 1){
                return 1;
            }
        }
        return 0;
    }

    ///////////////// Utils /////////////////////////

    function canExecute(uint256 workflowId, uint256 activityId, address msgSender)
        public
        returns (bool)
    {
        // check if msg.sender address is correct
        if (msgSender != workflows[workflowId].roleAddresses[activityId]) {
            workflows[workflowId].execStatus.canExecuteCheck = 4;
            return false;
        }
        
        // activity must be included
        if (workflows[workflowId].markings.included[activityId] == 0) {
            workflows[workflowId].execStatus.canExecuteCheck = 1;
            return false;
        }

        // all conditions executed
        for (
            uint256 id = 0;
            id < workflows[workflowId].relations[3].length;
            id++
        ) {
            uint256[] memory conditionsRow =
                workflows[workflowId].relations[3][id];
            if (conditionsRow[activityId] == 1) {
                if (
                    (workflows[workflowId].markings.executed[id] == 0) &&
                    (workflows[workflowId].markings.included[id] == 1)
                ) {
                    workflows[workflowId].execStatus.canExecuteCheck = 2;
                    return false;
                }
            }
        }

        // no milestones pending
        for (
            uint256 id = 0;
            id < workflows[workflowId].relations[4].length; // milestonesFrom
            id++
        ) {
            uint256[] memory milestonesRow =
                workflows[workflowId].relations[4][id];
            if (milestonesRow[activityId] == 1) {
                if (
                    (workflows[workflowId].markings.pending[id] == 1) &&
                    (workflows[workflowId].markings.included[id] == 1)
                ) {
                    workflows[workflowId].execStatus.canExecuteCheck = 3;
                    return false;
                }
            }
        }

        workflows[workflowId].execStatus.canExecuteCheck = 0;
        return true;
    }

    ///////////////// Main functions /////////////////////////
    function checkCliquedIndex(uint256 workflowId, uint256 activityId)
        public
    //        bytes memory ipfsHash
    {
        if (!canExecute(workflowId, activityId, msg.sender)) {
            workflows[workflowId].execStatus.status = 1;
            //revert();
        } else {
            // executed activity
            workflows[workflowId].markings.executed[activityId] = 1;
            workflows[workflowId].markings.pending[activityId] = 0;
            //            workflows[workflowId].ipfsActivityHashes[activityId] = ipfsHash;

            uint256[] memory exclude_vect_check =
                workflows[workflowId].relations[1][activityId]; // excludes
            uint256[] memory response_vect_check =
                workflows[workflowId].relations[2][activityId]; // responsesTo

            // add include relations
            uint256[] memory include_vect_check =
                workflows[workflowId].relations[0][activityId]; // includes

            // update with condition relations ok
            uint256[] memory conditionsTo =
                workflows[workflowId].relations[3][activityId]; //extract row condition
            for (uint256 id = 0; id < conditionsTo.length; id++) {
                if (conditionsTo[id] == 1) {
                    include_vect_check[id] = 1;
                }
            }

            for (
                uint256 id = 0;
                id < workflows[workflowId].relations[1].length; // excludesTo
                id++
            ) {
                // exclude and include relations pass
                // note includes happens after the exclude pass
                // included = (included & ~excludesTo[activityId]) | includesTo[activityId];
                if (
                    (exclude_vect_check[id] != 1) &&
                    (include_vect_check[id] == 1)
                ) {
                    workflows[workflowId].markings.included[id] = 1;
                }

                // response relations pass
                // pending = (pending | responsesTo[activityId]);
                if (response_vect_check[id] == 1) {
                    workflows[workflowId].markings.pending[id] = 1;
                    workflows[workflowId].markings.included[id] = 1;
                }
            }

            emit LogExecution(workflowId, activityId, msg.sender);

            workflows[workflowId].execStatus.status = 1;
        }
    }

    function createWorkflow(
        // packed state variables
        uint256[][] memory markingStates, // included, executed, pending

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
        workflows.push(wf);

        emit LogWorkflowCreation(workflows.length - 1, wf.name, msg.sender);
    }

    /** @dev post private projection approval function.
      * @param workflowId index of the workflow (eg 0 for the first workflow).
      * @param myAddress address of the sender (necessary for web3js dev).
      * @return list of approval outcomes.
      */
    function confirmProjection(uint256 workflowId, address myAddress) public payable returns (uint[] memory){
        // get id of approvalList.addresses corresponding to msgSender. If (approval[id]==0): set to one;
        
        require(myAddress==msg.sender, "Must be role owner.");

        for (
            uint256 id = 0;
            id < workflows[workflowId].approvalAddresses.length;
            id++
        ) {
            if((myAddress == workflows[workflowId].approvalAddresses[id]) && workflows[workflowId].didFetch[id] == 1){ // must have fetched public view
                if(workflows[workflowId].approvalOutcomes[id] != 1){ // must not have approved before
                    workflows[workflowId].approvalOutcomes[id] = 1;
                    emit LogWorkflowProjection(workflowId, myAddress);
                    return workflows[workflowId].approvalOutcomes;
                }
            }

        }
        
        return workflows[workflowId].approvalOutcomes;
        
    }  


}

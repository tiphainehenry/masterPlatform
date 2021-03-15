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

    // variable declarations.
    struct Workflow {
        string name;
        uint256[] included;
        uint256[] executed;
        uint256[] pending;
        string[] activityNames;
        bytes[] ipfsActivityHashes;
        uint256 numActivities; //number of included activities
        uint256[][] includesTo;
        uint256[][] excludesTo;
        uint256[][] responsesTo;
        uint256[][] conditionsFrom;
        uint256[][] milestonesFrom;
        Activity execStatus;
    }

    struct Activity {
        uint32 canExecuteCheck;
        uint256 status; //0=no, 1=yes
    }

    Workflow[] workflows;

    ///////////////// Misc ////////////////////////

    /** @dev Getter for workflow name.
      * @param workflowId index of the workflow (eg 0 for the first workflow).
      * @return workflow name.
      */
    function getWorflowName(uint256 workflowId)
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
        return workflows[workflowId].includesTo.length;
    }

    function getIncluded(uint256 workflowId)
        public
        view
        returns (uint256[] memory)
    {
        return workflows[workflowId].included;
    }

    function getExecuted(uint256 workflowId)
        public
        view
        returns (uint256[] memory)
    {
        return workflows[workflowId].executed;
    }

    function getPending(uint256 workflowId)
        public
        view
        returns (uint256[] memory)
    {
        return workflows[workflowId].pending;
    }

    function getConditionsFrom(uint256 workflowId)
        public
        view
        returns (uint256[][] memory)
    {
        return workflows[workflowId].conditionsFrom;
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

    ///////////////// Utils /////////////////////////

    function canExecute(uint256 workflowId, uint256 activityId)
        public
        returns (bool)
    {
        // activity must be included
        if (workflows[workflowId].included[activityId] == 0) {
            workflows[workflowId].execStatus.canExecuteCheck = 1;
            return false;
        }

        // all conditions executed
        for (
            uint256 id = 0;
            id < workflows[workflowId].conditionsFrom.length;
            id++
        ) {
            uint256[] memory conditionsRow =
                workflows[workflowId].conditionsFrom[id];
            if (conditionsRow[activityId] == 1) {
                if (
                    (workflows[workflowId].executed[id] == 0) &&
                    (workflows[workflowId].included[id] == 1)
                ) {
                    workflows[workflowId].execStatus.canExecuteCheck = 2;
                    return false;
                }
            }
        }

        // no milestones pending
        for (
            uint256 id = 0;
            id < workflows[workflowId].milestonesFrom.length;
            id++
        ) {
            uint256[] memory milestonesRow =
                workflows[workflowId].milestonesFrom[id];
            if (milestonesRow[activityId] == 1) {
                if (
                    (workflows[workflowId].pending[id] == 1) &&
                    (workflows[workflowId].included[id] == 1)
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

    function createWorkflow(
        // packed state variables
        uint256[] memory _includedStates,
        uint256[] memory _executedStates,
        uint256[] memory _pendingStates,
        string[] memory _activityNames,
        string memory _name,
        // relations
        uint256[][] memory _includesTo,
        uint256[][] memory _excludesTo,
        uint256[][] memory _responsesTo,
        uint256[][] memory _conditionsFrom,
        uint256[][] memory _milestonesFrom
    ) public payable {
        Activity memory execStatus = Activity(0, 0);
        Workflow memory wf =
            Workflow(
                _name,
                _includedStates,
                _executedStates,
                _pendingStates,
                _activityNames,
                new bytes[](_includedStates.length),
                _includedStates.length,
                _includesTo,
                _excludesTo,
                _responsesTo,
                _conditionsFrom,
                _milestonesFrom,
                execStatus
            );
        workflows.push(wf);

        emit LogWorkflowCreation(workflows.length - 1, wf.name, msg.sender);
    }

    function checkCliquedIndex(uint256 workflowId, uint256 activityId)
        public
    //        bytes memory ipfsHash
    {
        if (!canExecute(workflowId, activityId)) {
            workflows[workflowId].execStatus.status = 1;
            //revert();
        } else {
            // executed activity
            workflows[workflowId].executed[activityId] = 1;
            workflows[workflowId].pending[activityId] = 0;
            //            workflows[workflowId].ipfsActivityHashes[activityId] = ipfsHash;

            uint256[] memory exclude_vect_check =
                workflows[workflowId].excludesTo[activityId];
            uint256[] memory response_vect_check =
                workflows[workflowId].responsesTo[activityId];

            // add include relations
            uint256[] memory include_vect_check =
                workflows[workflowId].includesTo[activityId];

            // update with condition relations ok
            uint256[] memory conditionsTo =
                workflows[workflowId].conditionsFrom[activityId]; //extract row condition
            for (uint256 id = 0; id < conditionsTo.length; id++) {
                if (conditionsTo[id] == 1) {
                    include_vect_check[id] = 1;
                }
            }

            for (
                uint256 id = 0;
                id < workflows[workflowId].excludesTo.length;
                id++
            ) {
                // exclude and include relations pass
                // note includes happens after the exclude pass
                // included = (included & ~excludesTo[activityId]) | includesTo[activityId];
                if (
                    (exclude_vect_check[id] != 1) &&
                    (include_vect_check[id] == 1)
                ) {
                    workflows[workflowId].included[id] = 1;
                }

                // response relations pass
                // pending = (pending | responsesTo[activityId]);
                if (response_vect_check[id] == 1) {
                    workflows[workflowId].pending[id] = 1;
                    workflows[workflowId].included[id] = 1;
                }
            }

            emit LogExecution(workflowId, activityId, msg.sender);

            workflows[workflowId].execStatus.status = 1;
        }
    }
}

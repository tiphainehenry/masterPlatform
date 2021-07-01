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
    
    // CHANGE NEGOCIATION EVENTS
    event RequestChange(
        string workflowHashes,
        address[] indexed endorsers,
        address indexed initiator
    );
    event DeclineChange(
        string reqWkfHash,
        address indexed endorser
    );
    event AcceptChange(
        string reqWkfHash,
        address indexed endorser
    );

    event RSPErrorChange(
        string reqWkfHash,
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
        
        address[] approvalAddresses;
        uint[] approvalOutcomes;
        uint[] didFetch;
        Activity execStatus;

        ChangeRequest changeReq;

    }
    
    enum ChgStatus { Approved, Declined, BeingProcessed, Init }
    enum EndorserDecision { Approve, Decline, NA}

    struct ChangeRequest {
        ChgStatus status;
        string ipfsHash;
        address initiator;
        uint numEndorsers;
        address[] endorsers;
        EndorserDecision[] changeEndorsement;
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


    ///////////////// Change requests ////////////////////////

    /** @dev manages change requests: if a request is already ongoing, cancel. Else, create a new change request and notify endorsers.
      * @param toNotify list of endorser addreses.
      * @param _hashes concatenated string of current wkf and request wkf ipfs hashes (ref to the public view)
      * @param curr_hash current ipfs wkf hash
      * @param req_hash  ipfs hash of requested change description
      * @return processing decision.
      */
    function requestChange(address[] memory toNotify, string memory _hashes, string memory curr_hash, string memory req_hash) public payable returns (string memory) {
        
        if(workflows[curr_hash].changeReq.status == ChgStatus.Init ){
            
            workflows[curr_hash].changeReq.status = ChgStatus.BeingProcessed;
            workflows[curr_hash].changeReq.ipfsHash = req_hash;
            workflows[curr_hash].changeReq.initiator = msg.sender;
            workflows[curr_hash].changeReq.numEndorsers = toNotify.length;
            workflows[curr_hash].changeReq.endorsers = toNotify;
            
            for (
                uint256 id = 0;
                id < toNotify.length;
                id++
                ) {
                    workflows[curr_hash].changeReq.changeEndorsement[id] = EndorserDecision.NA;
                }

            emit RequestChange(_hashes,toNotify, msg.sender);
            return 'request has been successfully registered';
        }

        else{
            return 'another change request is already processed for this workflow';
        }    
    }


    function updateTableOnAddress(address  myAddress, address[] memory myAddresses, string memory myHash, EndorserDecision myDecision) public payable{
        for (
                uint256 id = 0;
                id < myAddresses.length;
                id++
            ) {
                if((myAddress == myAddresses[id])){
                    workflows[myHash].changeReq.changeEndorsement[id] = myDecision;
                }
            }   
    }


    function finalApprovalManager(string memory myHash) public payable {
        // check if all have answered --> if yes: unlock (set status to ChgStatus.Approved, update process markings and graph, )

        bool cumulatedDecisions = true;
        
        for (
                uint256 id = 0;
                id < workflows[myHash].changeReq.endorsers.length;
                id++
            ) {
                if((workflows[myHash].changeReq.changeEndorsement[id] != EndorserDecision.Approve)){
                     cumulatedDecisions = false;
                }
            }   
            
        if (cumulatedDecisions == true){
            workflows[myHash].changeReq.status == ChgStatus.Approved;
            // TODO Add graph locker/unlocker (update process markings and graph)
        }
        
    }

    function endorserRSP(string memory curr_hash, string memory req_hash, uint rsp) public payable returns (string memory) {
        
        if(workflows[curr_hash].changeReq.status == ChgStatus.BeingProcessed){
            // accept: emit decision and update change memory
            if (rsp==1){
                updateTableOnAddress(msg.sender,workflows[curr_hash].changeReq.endorsers, curr_hash,EndorserDecision.Approve);
                finalApprovalManager(curr_hash);
                emit AcceptChange(req_hash, msg.sender);
            }         
            
            // decline
            else if (rsp == 2){
                updateTableOnAddress(msg.sender,workflows[curr_hash].changeReq.endorsers, curr_hash,EndorserDecision.Decline);
                workflows[curr_hash].changeReq.status == ChgStatus.Declined;
                emit DeclineChange(req_hash, msg.sender);
            }
            
            else {
                emit RSPErrorChange(req_hash, msg.sender);
            }

            return 'RSP processed';
        }

        else{
            return 'RSP not applicable here (already processed?)';
        }    
    }



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
    
    function  getChangeValue(string memory _hash) public view returns (uint){
        return uint(workflows[_hash].changeReq.status);
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
        

        ChangeRequest memory chgReq = ChangeRequest(ChgStatus.Init,'',address(0), 0, new address[](_approvalAddresses.length),new EndorserDecision[](_approvalAddresses.length));       

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
                execStatus, chgReq
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

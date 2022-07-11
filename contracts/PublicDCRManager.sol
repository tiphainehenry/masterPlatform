// pragma solidity 0.5.10;
pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

import "./ProvableAPI_0.5.sol";
import "./Access_Matrix.sol";
import "./LibPublicDCRM.sol";



contract PublicDCRManager {
    // event declaration
    event LogWorkflowCreation(
        string indexed workflowHash,
        address indexed creator
    );

    event LogExecution(
        string indexed workflowHash,
        uint256 indexed activityId,
        uint256 indexed status
        //address indexed executor
    );

    event LogWorkflowProjection(
        string indexed workflowHash,
        address indexed creator
    );
    
    // CHANGE NEGOCIATION EVENTS
    event RequestChange(
        string workflowHashes,
        address indexed endorser,
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
    event AcceptChangeAll(
        string reqWkfHash
    );

    event RSPErrorChange(
        string reqWkfHash,
        address indexed endorser,
        string comment
    );

    // variable declarations.

    struct Workflow {
        string name;
        ChgStatus wkfStatus;

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
        Access_matrix access_matrix;

        //string publicData;
    }
    
    enum ChgStatus { Approved, Declined, BeingProcessed, Init, Switched }
   // enum EndorserDecision { Approve, Decline, NA}

    struct fooTest{
        string test;
        string testBis;
    }

    fooTest Test = fooTest({test:'init', testBis:'init'});

    struct ChangeRequest {
        string currHash; 
        string reqHash;
        ChgStatus status;
        address initiator;
        uint numEndorsers;
        address[] endorsers;
        uint[] changeEndorsement;

        uint[] approvalOutcomes;
        uint[] didFetch;
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
    mapping(string => ChangeRequest) changeRequests;



    ///////////////// Getters ////////////////////////

    function getAllWKHashes() public view returns (string[] memory){
        return registeredViewHashes;
    }

    function  getChangeArgs(string memory _hash) public view returns (string memory reqHash, uint ChangeValue, uint WKFValue, string memory _Test, uint[] memory ChangeEndorsement, uint numEndorsers, address initiator){
        
        return (    
                    changeRequests[_hash].reqHash,
                    uint(changeRequests[_hash].status), 
                    uint(workflows[_hash].wkfStatus),
                    Test.test,
                    changeRequests[_hash].changeEndorsement,
                    changeRequests[_hash].numEndorsers,
                    changeRequests[_hash].initiator
                    );

    }

    /** @dev Getter for workflow execution status.
      * @param _hash index of the workflow (eg 0 for the first workflow).
      * @return execution status of the task: 0=ok, 1= 
      */
    function getCanExecuteCheck(string memory _hash)
        public
        view
        returns (uint32)
    {
        return workflows[_hash].execStatus.canExecuteCheck;
    }

    function getVariableAddress(string memory _hash)
        public
        view
        returns (address)
    {
        return address(workflows[_hash].access_matrix);
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


    function getEndorserAddresses(string memory _hash)
        public
        view
        returns (address[] memory)
    {
        return changeRequests[_hash].endorsers;
    }

    ///////////////// Change requests ////////////////////////

    /** @dev manages change requests: if a request is already ongoing, cancel. Else, create a new change request and notify endorsers.
      * @param toNotify list
      * of endorser addreses.
      * @param _hashes concatenated string of current wkf and request wkf ipfs hashes (ref to the public view)
      * @param curr_hash current ipfs wkf hash
      * @param req_hash  ipfs hash of requested change description
      * @return processing decision.
      */
    function requestChange(address myAddress, address[] memory toNotify, string memory _hashes, string memory curr_hash, string memory req_hash) public payable {
        
        require(myAddress==msg.sender, "Must be role owner."); //web3js bug carefew 

        Test.test = 'chg request being processed';

        if(changeRequests[curr_hash].status == ChgStatus.Init){
            Test.test = 'chg request validated';
            //workflows[curr_hash].wkfStatus = ChgStatus.BeingProcessed;

            changeRequests[curr_hash].status = ChgStatus.BeingProcessed;
            changeRequests[curr_hash].reqHash = req_hash;
            changeRequests[curr_hash].initiator = myAddress;
            changeRequests[curr_hash].numEndorsers = toNotify.length;
            changeRequests[curr_hash].endorsers = toNotify;
            
            for (
                uint256 id = 0;
                id < toNotify.length;
                id++
                ) {
                    emit RequestChange(_hashes, toNotify[id], myAddress);
                    //changeRequests[curr_hash].changeEndorsement[id] = 0; //// @TIPHAINE: ISSUE HERE --> DO A GETTER FOR THE ARRAY AND WATCH BEHAVIOR 
                }

            // emit RequestChange(_hashes, toNotify, myAddress);
            // 'request has been successfully registered';
        }

        else{
            emit RSPErrorChange(req_hash, myAddress, 'another change request is already processed for this workflow');
        }    
    }


    function finalApprovalManager(string memory myHash) public payable {
        // check if required endorsers have answered --> if yes: unlock (set status to ChgStatus.Approved, update process markings and graph, )
        uint totalRsp =1; //message sender is already ok 
        
        for ( 
                uint256 id = 0;
                id < changeRequests[myHash].endorsers.length;
                id++
            ) {
                if((changeRequests[myHash].changeEndorsement[id] == 1)){
                     totalRsp = totalRsp+1;
                }
            }
            
        if (totalRsp == changeRequests[myHash].numEndorsers){
            Test.test  = 'approved by all endorsers';
            changeRequests[myHash].status == ChgStatus.Init;
            emit AcceptChangeAll(changeRequests[myHash].reqHash);
            
            // reinit chgEndorsement (?)
            // TODO update process markings and graph

        }
    }
    function updateTableOnAddress(address myAddress, address[] memory myAddresses, string memory myHash, uint myDecision) public payable{
        for (
                uint256 id = 0;
                id < myAddresses.length;
                id++
            ) {
                if((myAddress == myAddresses[id])){
                    changeRequests[myHash].changeEndorsement[id] = myDecision;
                }
            }   
    }
    function endorserRSP(address myAddress, string memory curr_hash, string memory req_hash, uint rsp) public payable returns (string memory) {
        
        if(changeRequests[curr_hash].status == ChgStatus.BeingProcessed){
            Test.test  = 'enteringNode';
            // accept: emit decision and update change memory
            if (rsp==1){
                updateTableOnAddress(myAddress,changeRequests[curr_hash].endorsers, curr_hash,1);
                Test.test  = 'approved by one person';
                emit AcceptChange(req_hash, myAddress);
                finalApprovalManager(curr_hash);
            }         
            
            // declineapprovalOutcomes
            else if (rsp == 2){
                Test.test  = 'declined';
                changeRequests[curr_hash].status = ChgStatus.Init;
                emit DeclineChange(req_hash, myAddress);
            }
            
            else {
                emit RSPErrorChange(req_hash, myAddress, 'wrong rsp answer');
            }

            return 'RSP processed';
        }

        else{
            return 'RSP not applicable here (already processed?)';
        }    
    }

    ////////////// Accepted Changes post treatment //////////////




    function getChangeApprovalsOutcome(string memory _hash)
        public
        view
        returns (uint[] memory)
    {
        return (changeRequests[_hash].approvalOutcomes);
    }

    function hasApprovedProjection(string memory _hash, address myAddress)
        public
        view
        returns (uint)
    {
        //uint res = 0;
        for (
            uint256 id = 0;
            id < changeRequests[_hash].endorsers.length;
            id++
        ) {
            if((myAddress == changeRequests[_hash].endorsers[id]) && changeRequests[_hash].approvalOutcomes[id] == 1){
                return 1;
            }
        }
        return 0;
    }

    /** @dev post private projection approval function.
      * @param _hash index of the workflow (eg 0 for the first workflow).
      * @param myAddress address of the sender (necessary for web3js dev).
      * @return list of approval outcomes.
      */
    function confirmChangeProjection(string memory _hash, address myAddress) public payable returns (uint[] memory){
        // get id of approvalList.addresses corresponding to msgSender. If (approval[id]==0): set to one;

        Test.testBis='A';

        require(myAddress==msg.sender, "Must be role owner.");
        Test.testBis='B';

        for (
            uint256 id = 0;
            id < changeRequests[_hash].endorsers.length;
            id++
        ) {
            Test.testBis='C';

            if((myAddress == changeRequests[_hash].endorsers[id]) ){ 

                Test.testBis='approval stage 1';
                if(changeRequests[_hash].approvalOutcomes[id] != 1){ // must not have approved before
                    changeRequests[_hash].approvalOutcomes[id] = 1;
                    emit LogWorkflowProjection(_hash, myAddress);
                    Test.testBis='approval stage 2';
                    if(LibPublicDCRM.evaluateChgApproval(changeRequests[_hash].approvalOutcomes, changeRequests[_hash].numEndorsers)==1){
                        changeRequests[_hash].status = ChgStatus.Approved;
                    }
                    return changeRequests[_hash].approvalOutcomes;
                }
            }
        }
        
        return changeRequests[_hash].approvalOutcomes;
    }  

    ///////////////// Public-to-local Projections ////////////////////////


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

    ///////////////// Execution functions /////////////////////////

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

    function checkCliquedIndex(string memory _hash, uint256 activityId)
        public
    //        bytes memory ipfsHash
    {
        if (!canExecute(_hash, activityId, msg.sender)) {
            workflows[_hash].execStatus.status = 1;
            emit LogExecution(_hash, activityId,1);

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

            emit LogExecution(_hash, activityId,0);

            workflows[_hash].execStatus.status = 1;
        }
    }


    ///////////////// Workflow creation /////////////////////////

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
        uint256[][][] memory _relations // includesto, excludesto, responsesto, conditionsfrom, milestonesFrom,

    ) public payable returns (address) {
        Access_matrix _access_matrix = new Access_matrix();
        Activity memory execStatus = Activity(0, 0);
        Marking memory markings = Marking(markingStates[0],markingStates[1],markingStates[2]);
        Workflow memory wf =
            Workflow(
                _name,
                ChgStatus.Init,
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
                execStatus,
                _access_matrix
                //_publicData
            );
        workflows[_ipfsViewHash]=wf;
        registeredViewHashes.push(_ipfsViewHash);

        ChangeRequest memory chgReq = ChangeRequest(
            _ipfsViewHash,
            '', 
            ChgStatus.Init,
            address(0), 
            0, 
            new address[](_approvalAddresses.length),
            new uint[](_approvalAddresses.length),
            new uint[](_approvalAddresses.length),
            new uint[](_approvalAddresses.length)
        );       

        changeRequests[_ipfsViewHash]=chgReq;

        emit LogWorkflowCreation(wf.ipfsViewHash, msg.sender);

        return address(_access_matrix);

    }



}

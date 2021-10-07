pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

library LibPublicDCRM {

        function evaluateChgApproval(uint[] memory approvals, uint numEndorsers) public pure returns (uint){
        uint totalRsp =0; //message sender is already ok 
            
            for ( 
                    uint256 id = 0;
                    id < numEndorsers;
                    id++
                ) {
                    if((approvals[id] == 1)){
                        totalRsp = totalRsp+1;
                    }
                }
                
            if (totalRsp == numEndorsers){
                return 1;
            }
            else{
                return 0;
            }
    }



}
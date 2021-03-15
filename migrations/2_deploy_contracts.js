//var DCRpublicEngine = artifacts.require("./DCRpublicEngine.sol");
var PublicDCRManager = artifacts.require("./PublicDCRManager.sol");

module.exports = function(deployer) {
//  deployer.deploy(DCRpublicEngine);
  deployer.deploy(PublicDCRManager);
};

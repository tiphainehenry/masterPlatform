//var DCRpublicEngine = artifacts.require("./DCRpublicEngine.sol");
var PublicDCRManager = artifacts.require("./PublicDCRManager.sol");
// var AdminRoleManager = artifacts.require("./AdminRoleManager.sol");

module.exports = function(deployer) {
//  deployer.deploy(DCRpublicEngine);
  deployer.deploy(PublicDCRManager);
  // deployer.deploy(AdminRoleManager);
};

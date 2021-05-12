//var DCRpublicEngine = artifacts.require("./DCRpublicEngine.sol");
const PublicDCRManager = artifacts.require("PublicDCRManager.sol");
const AdminRoleManager = artifacts.require("AdminRoleManager.sol");

module.exports = function(deployer) {
//  deployer.deploy(DCRpublicEngine);
  deployer.deploy(PublicDCRManager);
  deployer.deploy(AdminRoleManager);
};

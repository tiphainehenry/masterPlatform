//var DCRpublicEngine = artifacts.require("./DCRpublicEngine.sol");
const PublicDCRManager = artifacts.require("PublicDCRManager.sol");
const AdminRoleManager = artifacts.require("AdminRoleManager.sol");
const LibPublicDCRM = artifacts.require("LibPublicDCRM.sol");


module.exports = function(deployer) {
//  deployer.deploy(DCRpublicEngine);
  deployer.deploy(LibPublicDCRM);
  deployer.link(LibPublicDCRM,PublicDCRManager);
  deployer.deploy(PublicDCRManager);
  deployer.deploy(AdminRoleManager);

};

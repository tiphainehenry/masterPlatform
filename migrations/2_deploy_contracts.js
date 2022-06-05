//var DCRpublicEngine = artifacts.require("./DCRpublicEngine.sol");
const PublicDCRManager = artifacts.require("PublicDCRManager.sol");
const AdminRoleManager = artifacts.require("AdminRoleManager.sol");
const LibPublicDCRM = artifacts.require("LibPublicDCRM.sol");
const AdminIoTPoolManager = artifacts.require("AdminIoTPoolManager.sol");
const AdminIoTManager = artifacts.require("AdminIotManager.sol");
const IoTNFT = artifacts.require("IoTNFT.sol");
const IoT_ERC721 = artifacts.require("IoT_ERC721.sol");

module.exports = function(deployer) {
//  deployer.deploy(DCRpublicEngine);
  deployer.deploy(LibPublicDCRM);
  deployer.link(LibPublicDCRM,PublicDCRManager);
  deployer.deploy(PublicDCRManager);
  deployer.deploy(AdminRoleManager);
  deployer.deploy(AdminIoTPoolManager);
  deployer.deploy(AdminIoTManager);
  deployer.deploy(IoTNFT);
};



module.exports = async function(deployer) {
  await deployer.deploy(IoT_ERC721, "IoT_ERC721", "IoT_ERC721")
  const erc721 = await IoT_ERC721.deployed()
};
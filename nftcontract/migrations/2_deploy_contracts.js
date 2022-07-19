//var DCRpublicEngine = artifacts.require("./DCRpublicEngine.sol");
const NFTContract = artifacts.require("NFTContract.sol");


module.exports = function(deployer) {
  deployer.deploy(NFTContract);
};

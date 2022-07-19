const path = require("path");
const HDWalletProvider = require("@truffle/hdwallet-provider");
const MNEMONIC = "awkward genuine possible animal maze baby outside return movie panel echo letter cute wasp need";

// smart contract ropsten address: 0xd21445983ddeee252621603367cd45c658a85251

// module.exports = {
//   // See <http://truffleframework.com/docs/advanced/configuration>
//   // to customize your Truffle configuration!
//   contracts_build_directory: path.join(__dirname, "client/src/contracts"),
//   networks: {
//     development: {
//       network_id: "*",
//       host: '127.0.0.1',
//       port: 85450,
//       gas: 8721974
//     },
//     compilers: {
//       solc: {
//         version: "0.8.0"
//       }
//     },
//     ropsten: {
//       provider: new HDWalletProvider(MNEMONIC, "https://ropsten.infura.io/v3/f86c1527e7f24bf99018c94a7b5abae4"),
//       network_id: '3',
//       //gas: 4000000      //make sure this gas allocation isn't over 4M, which is the max
//     }
//   }
// };


module.exports = {
  /**
   * Networks define how you connect to your ethereum client and let you set the
   * defaults web3 uses to send transactions. If you don't specify one truffle
   * will spin up a development blockchain for you on port 9545 when you
   * run `develop` or `test`. You can ask a truffle command to use a specific
   * network from the command line, e.g
   *
   * $ truffle test --network <network-name>
   */
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  networks: {
    development: {
      network_id: "*",
      host: '127.0.0.1',
      port: 8545,
      gas: 8721974
    },



    // Configure your compilers


    // Truffle DB is currently disabled by default; to enable it, change enabled:
    // false to enabled: true. The default storage location can also be
    // overridden by specifying the adapter settings, as shown in the commented code below.
    //
    // NOTE: It is not possible to migrate your contracts to truffle DB and you should
    // make a backup of your artifacts to a safe location before enabling this feature.
    //
    // After you backed up your artifacts you can utilize db by running migrate as follows:
    // $ truffle migrate --reset --compile-all
    //
    // db: {
    //   enabled: false,
    //   host: "127.0.0.1",
    //   adapter: {
    //     name: "sqlite",
    //     settings: {
    //       directory: ".db"
    //     }
    //   }
    // }
  },
  compilers: {
    solc: {
      version: "0.5.16",      // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      // settings: {          // See the solidity docs for advice about optimization and evmVersion
      //  optimizer: {
      //    enabled: false,
      //    runs: 200
      //  },
      //  evmVersion: "byzantium"
      // }
    }
  }
};

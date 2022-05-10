const dotenv = require("dotenv");
dotenv.config({path: __dirname + '/.env'});
const { PK_JFD, PKJJ, PK_ZZZ, PK_VINOD, URL_RINKEBY, URL_MUMBAI, API_KEY_RINKEBY, API_KEY_MUMBAI } = process.env;
require("@nomiclabs/hardhat-waffle");
require("@openzeppelin/hardhat-upgrades");
require("@nomiclabs/hardhat-etherscan");
require('@openzeppelin/hardhat-upgrades');
require('solidity-coverage');

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {

  solidity: {
    version:"0.8.0",
    settings: {
    optimizer: {
      enabled: true,
      runs: 200
      }
    }
  },
  // solidity: {
  //   version:"0.4.26",
  //   settings: {
  //   optimizer: {
  //     enabled: true,
  //     runs: 200
  //     }
  //   }
  // },
paths:{
  // tests:'./test'
  // tests:"./test_alreadyDeployed",
  // sources:"./USDT_contracts",
},
mocha:{
  timeout:600000
},
networks: {
  hardhat: {
    // gasPrice : 500 * 1000000000
  },
  rinkeby:{
    // gasPrice : secret.gasPrice * 1000000000,
    url: URL_RINKEBY,
    accounts: [PK_JFD]
  },
  mumbai:{
    // gasPrice : secret.gasPrice * 1000000000,
    url: URL_MUMBAI,
    accounts: [PK_JFD],
  },
  rinkebyTest:{
    url: URL_RINKEBY,
    accounts: [PK_JFD, PKJJ, PK_ZZZ],
  },
  mumbaiTest:{
    url: URL_MUMBAI,
    accounts: [PK_JFD,PK_VINOD,PK_ZZZ,PK_ZZZ,PKJJ],
  }
},
etherscan: {
  // Your API key for Etherscan
  // Obtain one at https://etherscan.io/
  apiKey: {
    rinkeby: API_KEY_RINKEBY,
    polygonMumbai: API_KEY_MUMBAI
  }
}
};

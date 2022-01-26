// require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
const decryptAccount = require("./decrypt");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("mint", "Mints an NFT")
  .addPositionalParam("imageFilePath")
  .addPositionalParam("recipient")
  .addOptionalPositionalParam("nftName")
  .setAction(async (taskArgs) => {
    const main = require("./scripts/mint.js");
    await main(taskArgs).catch((error) => {
      console.error(error);
      process.exit(1);
    });
  });

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.9",
  networks: {
    rinkeby: {
      url: "https://rinkeby.infura.io/v3/fd2b60ff335643bf916d6246a8e2008a", //<---- YOUR INFURA ID! (or it won't work)
      accounts: [decryptAccount()],
    },
    eth: {
      url: "https://mainnet.infura.io/v3/fd2b60ff335643bf916d6246a8e2008a", //<---- YOUR INFURA ID! (or it won't work)
      accounts: [decryptAccount()],
    },
    matic: {
      url: "https://rpc-mainnet.maticvigil.com/",
      accounts: [decryptAccount()],
    },
    mumbai: {
      url: "https://rpc-mumbai.maticvigil.com/",
      accounts: [decryptAccount()],
    },
  },
  etherscan: {
    apiKey: {
      mainnet: "AG1CI4IBR8QD1JEMMVPE6VI4CF8AU1GV7K",
      rinkeby: "AG1CI4IBR8QD1JEMMVPE6VI4CF8AU1GV7K",
      polygon: "SS7U23ZIAEA981GX7K2CPJXT81YJQZXHQ7",
      polygonMumbai: "SS7U23ZIAEA981GX7K2CPJXT81YJQZXHQ7",
    },
  },
};

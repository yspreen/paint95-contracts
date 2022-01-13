require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
const crypto = require("crypto");
const fs = require("fs");

const algorithm = "aes-256-ctr";
const secretKey = "LocNrhaJUdArjCG5BlXiChZu2ceL4l32";

const encrypt = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);

  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

  return {
    iv: iv.toString("hex"),
    content: encrypted.toString("hex"),
  };
};

if (process.env.PRIVATE_KEY) {
  console.info('Put this into "./privateKey.enc.txt":');
  console.log(JSON.stringify(encrypt(process.env.PRIVATE_KEY)));
}

const decrypt = (encrypted) => {
  const decipher = crypto.createDecipheriv(
    algorithm,
    secretKey,
    Buffer.from(encrypted.iv, "hex")
  );

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted.content, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString();
};

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

function decryptAccount() {
  try {
    text = fs.readFileSync("./privateKey.enc.txt").toString();
    const key = decrypt(JSON.parse(text));
    return key;
  } catch (e) {
    console.error(
      e,
      "☢️ WARNING: No mnemonic file created for a deploy account. Try `yarn run generate` and then `yarn run account`."
    );
  }
}

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.7",
  networks: {
    rinkeby: {
      url: "https://rinkeby.infura.io/v3/xxx", //<---- YOUR INFURA ID! (or it won't work)
      accounts: [decryptAccount()],
    },
    eth: {
      url: "https://mainnet.infura.io/v3/xxx", //<---- YOUR INFURA ID! (or it won't work)
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
      mainnet: "YOUR_ETHERSCAN_API_KEY",
      rinkeby: "YOUR_ETHERSCAN_API_KEY",
      polygon: "YOUR_POLYGONSCAN_API_KEY",
      polygonMumbai: "YOUR_POLYGONSCAN_API_KEY",
    },
  },
};

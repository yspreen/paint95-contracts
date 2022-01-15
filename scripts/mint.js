// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const contractAddress = fs
    .readFileSync("./.contract.addr.txt")
    .toString()
    .trim();

  const Contract = await ethers.getContractFactory("Paint95");
  const hardhatContract = await Contract.attach(contractAddress);

  const response = await hardhatContract.getLastTokenId();
  const id = ~~response + 1;
  await hardhatContract.mint(
    "0x46971de277BC94d76d159A3Ffdd397eaE45Be595",
    "https://gist.githubusercontent.com/yspreen/6c7fff86248bf7acdf8c46807af42324/raw/4cdd3a09309107fec4ca09b4e05c0b1fd4d222cb/tmp.json"
  );
  console.info({ id });
  return id;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const fs = require("fs");
const IPFS = require("ipfs-http-client");
const ipfs = IPFS.create(new URL("https://ipfs.infura.io:5001"));

module.exports = async (args, outsideHardhat = false) => {
  let eth;
  if (outsideHardhat) {
    eth = require("ethers");
  } else {
    require("hardhat");
    eth = ethers;
  }
  const contractAddress = fs
    .readFileSync("./.contract.addr.txt")
    .toString()
    .trim();

  const filePath = args.imageFilePath;
  const recipient = args.recipient;
  const name = args.nftName || "Paint95 Painting";
  const note = args.authorNote || null;

  if (!filePath) {
    console.error("Please run like:\n<script> filename.png [nft-name]");
    return;
  }

  let description = "This NFT was created and minted for free on Paint95.xyz";
  description +=
    " \nRoyalties are split between the artist and the Paint95 platform.";
  if (note) {
    description +=
      " \nAuthor's note: " + note.replace(/[^\w\d\s\.\/\!\,\-]/gi, "");
  }

  const imgData = fs.readFileSync(filePath);

  const fileExt = filePath.slice(filePath.lastIndexOf(".") + 1).toLowerCase();

  const imgIpfsResult = await ipfs.add(
    {
      path: `paint95.${fileExt}`,
      content: imgData,
    },
    { wrapWithDirectory: true }
  );
  const imgIpfs = `ipfs://${imgIpfsResult.cid}/paint95.${fileExt}`;

  const metadata = {
    description,
    // "external_url": "https://openseacreatures.io/3",
    image: imgIpfs,
    name,
  };

  const metaIpfsResult = await ipfs.add(
    {
      path: `paint95.json`,
      content: JSON.stringify(metadata),
    },
    { wrapWithDirectory: true }
  );
  const metaIpfs = `ipfs://${metaIpfsResult.cid}/paint95.json`;

  const Contract = await eth.getContractFactory("Paint95");
  const hardhatContract = await Contract.attach(contractAddress);

  const response = await hardhatContract.getLastTokenId();
  const id = ~~response + 1;
  await hardhatContract.mint(recipient, metaIpfs);
  console.info({ id });
  return id;
};

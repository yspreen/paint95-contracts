// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const fs = require("fs");
const IPFS = require("ipfs-http-client");
const ipfs = IPFS.create(new URL("https://ipfs.infura.io:5001"));

function base64ArrayBuffer(arrayBuffer) {
  let base64 = "";
  const encodings =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  const bytes = new Uint8Array(arrayBuffer);
  const byteLength = bytes.byteLength;
  const byteRemainder = byteLength % 3;
  const mainLength = byteLength - byteRemainder;

  let a;
  let b;
  let c;
  let d;
  let chunk;

  // Main loop deals with bytes in chunks of 3
  for (let i = 0; i < mainLength; i += 3) {
    // Combine the three bytes into a single integer
    chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

    // Use bitmasks to extract 6-bit segments from the triplet
    a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
    b = (chunk & 258048) >> 12; // 258048   = (2^6 - 1) << 12
    c = (chunk & 4032) >> 6; // 4032     = (2^6 - 1) << 6
    d = chunk & 63; // 63       = 2^6 - 1

    // Convert the raw binary segments to the appropriate ASCII encoding
    base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
  }

  // Deal with the remaining bytes and padding
  if (byteRemainder === 1) {
    chunk = bytes[mainLength];

    a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

    // Set the 4 least significant bits to zero
    b = (chunk & 3) << 4; // 3   = 2^2 - 1

    base64 += `${encodings[a]}${encodings[b]}==`;
  } else if (byteRemainder === 2) {
    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

    a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
    b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4

    // Set the 2 least significant bits to zero
    c = (chunk & 15) << 2; // 15    = 2^4 - 1

    base64 += `${encodings[a]}${encodings[b]}${encodings[c]}=`;
  }

  return base64;
}

module.exports = async (args) => {
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

  const Contract = await ethers.getContractFactory("Paint95");
  const hardhatContract = await Contract.attach(contractAddress);

  const response = await hardhatContract.getLastTokenId();
  const id = ~~response + 1;
  await hardhatContract.mint(recipient, metaIpfs);
  console.info({ id });
  return id;
};

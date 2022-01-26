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

module.exports = decryptAccount;

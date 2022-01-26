const AWS = require("aws-sdk");
const decryptAccount = require("./decrypt");

module.exports.api = async (event) => {
  const message = event;
  const key = decryptAccount();
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
    }),
  };
};

const crypto = require("crypto");

exports.encryptToken = (code) => {
  const encrypted = crypto
    .createHash("sha256")
    .update(code, "utf8")
    .digest("hex");

  return encrypted;
};

exports.decryptToken = (token) => {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
};

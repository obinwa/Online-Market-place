exports.generateFiveDigits = () => {
  return Math.floor(Math.random() * (10000 - 99999 + 1) + 99999);
};

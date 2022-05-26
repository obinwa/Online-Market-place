const { generateAccessToken, generateRefreshToken } = require("./token");
const AppSuccess = require("./appSuccess");
// const redis=
const client = require("../connect/redis");

exports.createLoginCreds = async (res, payload) => {
  const { isActivated, id, email } = payload;
  const accessToken = await generateAccessToken(payload);
  const refreshToken = await generateRefreshToken(payload);

  // await client.sAddAsync("user", `user-${id}`);

  // await client.hset(`user-${id}`, "id", id);
  // await client.hsetAsync(`user-${id}`, "isActivated", isActivated);
  // await client.hsetAsync(`user-${id}`, "email", email);
  // await client.hsetAsync(`user-${id}`, "token", accessToken);
  // await client.hsetAsync(`user-${id}`, "refreshToken", refreshToken);

  const token = {
    accessToken,
    refreshToken,
  };
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.AFRISERVE_COOKIE_EXPIRES_IN * 30 * 60 * 1000
    ),
    secure: false,
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", accessToken, cookieOptions);

  //user should be marked as registration completed
  //let user = await User.findByPk(id);
  //user.registrationStatus = "Completed";
  //await user.save();

  return new AppSuccess(res, token).LOGIN_SUCCESSFUL();
};

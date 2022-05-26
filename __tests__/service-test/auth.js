let { registerService, loginService } = require("../../services/auth");
const {
  User,
  Otp,
  Location,
  Service,
  ArtisanService,
  AccountDetails,
} = require("../../db/models/index");
const { Op } = require("sequelize");

jest.setTimeout(10000000);

describe("register user", () => {
  test("register-dummy-user", async () => {
    let userDetails = {
      firstName: "Didi",
      lastName: "Ayorinde",
      email: "didiayo@gmail.com",
      phoneNumber: "09876543210",
      service: "Plumbing",
      password: "ayodidi123",
      userRole: "Artisan",
      address: "1, Address Street",
      localGovernment: "Ikigosi",
      city: "Akure",
      state: "Ondo",
      idImage: "itititititototo",
      proofOfAddress: "fuurtitototototo",
      profileImage: "",
    };

    let user = await registerService(userDetails);
    let artisanService = await ArtisanService.findOne({
      where: { [Op.and]: [{ userId: user.id }, { ranking: "Primary" }] },
    });
    let service = await Service.findByPk(artisanService.serviceId);
    let location = await Location.findOne({ where: { userId: user.id } });
    expect(service.name).toBe("Plumbing");
    expect(location.city).toBe("Akure");

    await location.destroy();
    await artisanService.destroy();
    await user.destroy();
  });
});

describe("login a user", () => {
  test("return status of login for a completetd user", async () => {
    const login = await loginService("mayowad43@gmail", "Dev.Dabiri1");
    expect(user.status).toBe("login");
  });
  test("return status pending for a pending registration user", async () => {
    const login = await loginService("mayowad43@gmail", "Dev.Dabiri1");
    expect(user.status).toBe("pending");
  });
});

let {
  saveAccountDetailsService,
  userInformationService,
} = require("../../services/artisan");
let { registerService } = require("../../services/auth");
const {
  User,
  Otp,
  Location,
  Service,
  ArtisanService,
  AccountDetails,
} = require("../../db/models/index");

jest.setTimeout(10000000);

describe("register user and get all information", () => {
  test("correct-values", async () => {
    let userDetails = {
      firstName: "Baderish",
      lastName: "Kapil",
      email: "baderishk@gmail.com",
      phoneNumber: "09876543220",
      service: "Barbing",
      password: "badersih123",
      userRole: "Artisan",
      address: "1, Address Street",
      localGovernment: "Ikigosi",
      city: "Akure",
      state: "Ondo",
      idImage: "ititititi",
      proofOfAddress: "fuurtitat11tueeotr",
    };

    let user = await registerService(userDetails);
    let userInfo = await userInformationService(user.id);
    let artisanService = await ArtisanService.findAll({
      where: { userId: user.id },
    });
    let service = await Service.findByPk(artisanService[0].serviceId);
    let location = await Location.findOne({ where: { userId: user.id } });
    expect(service.name).toBe("Barbing");
    expect(location.city).toBe("Akure");

    await Location.destroy({ where: { userId: user.id } });
    await ArtisanService.destroy({ where: { userId: user.id } });
    await user.destroy();
  });
});

describe("save user bank details", () => {
  beforeAll(async () => {
    let user = await User.create({
      id: 10,
      firstName: "Bill",
      lastName: "Bash",
      email: "billBash@gmail.com",
      phoneNumber: "01734567890",
      userRole: "Artisan",
      registrationStatus: "completed",
      password: "12wqeery",
    });
  });

  test("correct values", async () => {
    let bankDetails = {
      accountNumber: "0123456778",
      bankName: "JAIZ BANK",
      bankCode: "0998",
      accountName: "BILL BASH J",
    };

    await saveAccountDetailsService(10, bankDetails);
    let accountDetails = await AccountDetails.findOne({
      where: { userId: 10 },
    });
    expect(accountDetails.accountNumber).toBe("0123456778");
  });
  afterAll(async () => {
    await AccountDetails.destroy({ where: { userId: 10 } });
    await User.destroy({ where: { id: 10 } });
  });
});

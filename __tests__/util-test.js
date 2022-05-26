let {resolveUserFiles} = require("../services/artisan");

jest.setTimeout(10000000);

describe("get base64 string for user ", () => {
  test("resolve-files", async () => {
    let userDetails = {
      firstName:"Didi",
      lastName:"Ayorinde",
      email:"didiayo@gmail.com",
      phoneNumber:"09876543210",
      service:"Plumbing",
      password:"ayodidi123",
      userRole:"Artisan",
      address:"1, Address Street", 
      localGovernment:"Ikigosi",
      city:"Akure",
      state:"Ondo",
      idImageUrl:"new-file",
      proofOfAddressUrl:"test-file.txt",
      profileImageUrl:"test-file.txt"
    }

    let resolvedUser = await resolveUserFiles(userDetails);
    expect(resolvedUser.idImage).toBe("SGVsbG8NClRoaXMgaXMgYSB0ZXN0IGZpbGU=");
    expect(resolvedUser.profileImage).toBe("SGVsbG8NClRoaXMgaXMgYSB0ZXN0IGZpbGU=");
    expect(resolvedUser.proofOfAddress).toBe("SGVsbG8NClRoaXMgaXMgYSB0ZXN0IGZpbGU=");
  });
});
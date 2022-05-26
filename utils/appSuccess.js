class AppSuccess {
  constructor(res, data = null) {
    this.res = res;
    this.data = data;
  }

  OPERATION_SUCCESSFUL() {
    return this.res.status(201).json({
      status: true,
      message: "Operation Successful",
      error: null,
      data: this.data,
    });
  }

  ACCOUNTCREATED() {
    return this.res.status(201).json({
      status: true,
      message: "Account created successfully",
      error: null,
      data: this.data,
    });
  }

  OTP_CREATED() {
    return this.res.status(201).json({
      status: true,
      message:
        "An OTP has been generated to complete registration, Kindly check the phone number/email provided to continue",
      error: null,
      data: this.data,
    });
  }

  OTP_CREATED_SMS() {
    return this.res.status(201).json({
      status: true,
      message:
        "An OTP has been generated to complete the update of your phone number,Kindly check the phone number provided to continue.",
      error: null,
      data: this.data,
    });
  }

  USER_VERIFIED() {
    return this.res.status(200).json({
      status: true,
      message: "User verified",
      error: null,
      data: this.data,
    });
  }
  LOGIN_SUCCESSFUL() {
    return this.res.status(200).json({
      status: true,
      message: "Logged In successfully",
      error: null,
      data: this.data,
    });
  }

  OTP_VERIFIED() {
    return this.res.status(200).json({
      status: true,
      message: "OTP verified successfully",
      error: null,
      data: this.data,
    });
  }

  FETCHED_SUCCESFULLY() {
    return this.res.status(200).json({
      status: true,
      message: "Fetched successfully",
      error: null,
      data: this.data,
    });
  }

  CREATED_SUCCESSFULLY(type) {
    return this.res.status(201).json({
      status: true,
      message: `A new ${type} has been created successfully`,
      error: null,
      data: this.data,
    });
  }

  UPDATED_SUCCESSFULLY(type) {
    return this.res.status(201).json({
      status: true,
      message: `${type} has been updated successfully`,
      error: null,
      data: this.data,
    });
  }

  DELETED_SUCCESSFULLY(type) {
    return this.res.status(201).json({
      status: true,
      message: `${type} has been deleted successfully`,
      error: null,
      data: this.data,
    });
  }
  USER_ADDED() {
    return this.res.status(201).json({
      status: true,
      message: `An invite has been sent to the email provided`,
      error: null,
      data: this.data,
    });
  }

  PASSWORD_CHANGED() {
    return this.res.status(200).json({
      status: true,
      message: `Password has been successfully changed`,
      error: null,
      data: this.data,
    });
  }
}

module.exports = AppSuccess;

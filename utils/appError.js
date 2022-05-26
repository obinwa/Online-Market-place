class AppError extends Error {
  constructor() {
    super();
  }

  GENERIC_ERROR(errorMessage) {
    return {
      message: errorMessage,
      statusCode: 500,
    };
  }

  INVALID_KEY() {
    return {
      message: 'Internal processing error',
      statusCode: 500,
    };
  }

  NULL_USER_ID_FROM_SESSION() {
    return {
      message: 'User session data not found',
      statusCode: 500,
    };
  }

  LOGGED_IN_USER_NOT_FOUND() {
    return {
      message: 'User session data not found',
      statusCode: 500,
    };
  }

  EMAIL_ALREADY_EXISTS() {
    return {
      message: 'Email already exists',
      statusCode: 400,
    };
  }

  USER_REGISTER_MODE(type) {
    return {
      message: `This email address registered via ${email}, kindly enter your password`,
      statusCode: 400,
    };
  }
  PHONE_ALREADY_EXISTS() {
    return {
      message: 'Phone number already exists',
      statusCode: 400,
    };
  }

  USER_NOT_VERIFIED() {
    return {
      message: 'User is not verified, Enter the OTP sent to your phone number',
      statusCode: 400,
    };
  }

  INVALID_OTP() {
    return {
      message: 'Invalid OTP, pls retry',
      statusCode: 400,
    };
  }

  EXPIRED_OTP() {
    return {
      message: 'OTP has expired, click resend to generate another OTP',
      statusCode: 400,
    };
  }
  USER_NOT_FOUND() {
    return {
      message: 'User not found',
      statusCode: 404,
    };
  }

  USER_BLOCKED() {
    return {
      message: 'User is blocked. Please contact the  administrator',
      statusCode: 418,
    };
  }

  INCORRECT_DETAILS() {
    return {
      message: 'Incorrect User / password',
      statusCode: 400,
    };
  }

  INVALID_TOKEN() {
    return {
      message: 'Invalid token',
      statusCode: 400,
    };
  }

  NOT_VERIFIED() {
    return {
      message: 'User is not verified',
      statusCode: 400,
    };
  }

  PASSWORD_MATCH() {
    return {
      message:
        'Sorry this password is the same as your old one. Please choose another',
      statusCode: 400,
    };
  }

  UNVERIFIED_TOKEN() {
    return {
      message: 'Error verifying token',
      statusCode: 401,
    };
  }
  UNAUTHORIZED() {
    return {
      message: 'You are not authorized to view this route',
      statusCode: 403,
    };
  }

  EXPIRED_TOKEN() {
    return {
      message: 'Token has expired, login in again',
      statusCode: 403,
    };
  }
  DEACTIVATED() {
    return {
      message: 'User has been deactivated',
      statusCode: 403,
    };
  }
  PHONE_NUMBER_ALREADY_EXISTS() {
    return {
      message: 'Phone number already exists',
      statusCode: 400,
    };
  }
  DISSAPROVED() {
    return {
      message: 'You profile has been disapproved, pls contact admin',
      statusCode: 403,
    };
  }
}

module.exports = AppError;

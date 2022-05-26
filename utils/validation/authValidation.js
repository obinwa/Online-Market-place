const Joi = require('joi');

const registerSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email({ minDomainSegments: 2 }),
  phoneNumber: Joi.string()
    .regex(/^[+234][0-9]{13}/)
    .required()
    .label('Please enter a valid phone number starting with +234'),
  userRole: Joi.string().required(),
  password: Joi.string()
    .regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?.!@$%^&*-]).{6,}$/)
    .min(6)
    .max(20)
    .required()
    .label(
      'Please enter a password that is between 6 to 20, made of a number, a special symbol,a capital letter and a small letter'
    ),
  serviceId: Joi.string(),
  localGovernment: Joi.string(),
  address: Joi.string(),
  city: Joi.string(),
  state: Joi.string(),
  idImage: Joi.string(),
  proofOfAddress: Joi.string(),
  country: Joi.string(),
  profileImage: Joi.string(),
  price: Joi.string(),
});

const loginSchema = Joi.object({
  email: Joi.string().email({ minDomainSegments: 2 }),
  password: Joi.string()
    .regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?.!@$%^&*-]).{6,}$/)
    .min(6)
    .max(20)
    .required()
    .label(
      'Please enter a password that is between 6 to 20, made of a number, a special symbol,a capital letter and a small letter'
    ),
});
const forgotPasswordSchema = Joi.object({
  email: Joi.string().email({ minDomainSegments: 2 }),
  userRole: Joi.string(),
});

const resetPasswordSchema = Joi.object({
  password: Joi.string()
    .regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?.!@$%^&*-]).{6,}$/)
    .min(6)
    .max(20)
    .required()
    .label(
      'Please enter a password that is between 6 to 20, made of a number, a special symbol,a capital letter and a small letter'
    ),
  email: Joi.string().email({ minDomainSegments: 2 }),
  token: Joi.required(),
});

const changePasswordSchema = Joi.object({
  oldPassword: Joi.string()
    .regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?.!@$%^&*-]).{6,}$/)
    .min(6)
    .max(20)
    .required()
    .label(
      'Please enter a password that is between 6 to 20, made of a number, a special symbol,a capital letter and a small letter'
    ),

  newPassword: Joi.string()
    .regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?.!@$%^&*-]).{6,}$/)
    .min(6)
    .max(20)
    .required()
    .label(
      'Please enter a password that is between 6 to 20, made of a number, a special symbol,a capital letter and a small letter'
    ),
});

module.exports = {
  registerSchema,
  loginSchema,
  resetPasswordSchema,
  changePasswordSchema,
  forgotPasswordSchema,
};

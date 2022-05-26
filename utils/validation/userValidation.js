const Joi = require("joi");

const profileSchema = Joi.object({
  firstName: Joi.string(),
  lastName: Joi.string(),
  email: Joi.string().email({ minDomainSegments: 2 }),
  profileImage: Joi.string(),
  address: Joi.string(),
  localGovernment: Joi.string(),
  state: Joi.string(),
  country: Joi.string(),
  nokFirstName: Joi.string(),
  nokLastName: Joi.string(),
  nokEmail: Joi.string(),
  nokPhoneNumber: Joi.string(),
  city: Joi.string(),
  nokRelationship: Joi.string(),
  nokAddress: Joi.string(),
  nokState: Joi.string(),
  nokLocalGovernment: Joi.string(),
  nokCity: Joi.string(),
  nokCountry: Joi.string(),
});

const phoneNumberSchema = Joi.object({
  phoneNumber: Joi.string()
  .regex(/^[+234][0-9]{13}/).required()
  .label("Please enter a valid phone number starting with +234"),
})

const bankAccountSchema = Joi.object({
  accountNumber: Joi.string().regex(/[0-9]{10}/).required()
  .label("Please enter a valid Account Number made of 10 digits"),
  bankName :  Joi.string().required(),
  accountName:  Joi.string().required(),
  bankCode:  Joi.string().required(),
});

const  kycSchema = Joi.object({
  nokFirstName:Joi.string().required(),
  nokLastName:Joi.string().required(),
  nokEmail :Joi.string().required(),
  nokPhoneNumber :Joi.string().required(),
  idImage :Joi.string(),
  proofOfAddress :Joi.string(),
});

const serviceSchema = Joi.object({
  primaryServiceId:Joi.number(),
  primaryServicePrice:Joi.number(),
  secondaryServiceId:Joi.number().required(),
  secondaryServicePrice:Joi.number().required(),
})

const artisanSearchSchema = Joi.object({
  localGovernment:Joi.string().required(),
  serviceName:Joi.string().required(),
  dateTime :Joi.string().required().regex(/((?:19|20)[0-9][0-9])-(0?[1-9]|1[012])-([12][0-9]|3[01]|0?[1-9])/)
  .label("Please enter a valid date in the format yyyy-MM-dd"),
});



const profileFilesSchema = Joi.object({
  file: Joi.string().required(),
})

module.exports = {
  profileSchema,
  bankAccountSchema,
  kycSchema,
  artisanSearchSchema,
  phoneNumberSchema,
  profileFilesSchema,
  serviceSchema
};
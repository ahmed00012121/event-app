const Joi = require("joi");

// Student signup validation
const validateStudentSignup = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    department: Joi.string().required(),
    year: Joi.number().integer().min(1).max(5).required(),
  });
  return schema.validate(data);
};

// Student login validation
const validateStudentLogin = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });
  return schema.validate(data);
};

module.exports = { validateStudentSignup, validateStudentLogin };

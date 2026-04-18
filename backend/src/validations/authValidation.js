import Joi from "joi";

export const registerSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().min(6).required(),
    email: Joi.string().email().required(),
    firstname: Joi.string().required(),
    lastname: Joi.string().required()
});
export const loginSchema=Joi.object({
    username:Joi.string().required(),
    password:Joi.string().min(6).required()
});
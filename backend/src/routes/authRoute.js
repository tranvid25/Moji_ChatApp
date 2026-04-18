import express from 'express';
import { signIn, signUp } from '../controllers/authController.js';
import { validate } from '../middlewares/validate.js';
import { loginSchema, registerSchema } from '../validations/authValidation.js';
const router=express.Router();
router.post("/signup", validate(registerSchema), signUp);
router.post("/login",validate(loginSchema),signIn);
export default router;
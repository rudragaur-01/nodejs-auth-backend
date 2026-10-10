import express from 'express';
import { forgotPasswordController, loginController, logoutController, refreshController, registerController, resetPasswordController, verifyEmailController } from './auth.controller';


const router = express.Router()

router.post('/register',registerController)
router.post('/login',loginController)
router.post('/logout',logoutController)
router.post('/refresh',refreshController)
router.get('/verify-email',verifyEmailController)
router.post('/forgot-password',forgotPasswordController)
router.post('/reset-password',resetPasswordController)

export default router
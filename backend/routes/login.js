import express from 'express';
import loginController from '../controllers/loginController.js';

const router = express.Router();

// Controller for handling login logic

router.post('/login', loginController.loginUser);

export default router;
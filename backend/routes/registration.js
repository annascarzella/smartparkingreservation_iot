import express from 'express';
import registrationController from '../controllers/registrationController.js';

const router = express.Router();

// Controller for handling registration logic

router.post('/register', registrationController.registerUser);

export default router;
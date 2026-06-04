const express = require('express');
const router = express.Router();
const { register, login, getMe, updateSettings, logout } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validateRequest');
const { registerSchema, loginSchema, updateSettingsSchema } = require('../validations');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many authentication attempts, please try again after 15 minutes',
});

// Bypass limiter in dev
const limiterMiddleware = process.env.NODE_ENV === 'production' ? authLimiter : (req, res, next) => next();

router.post('/register', limiterMiddleware, validateRequest(registerSchema), register);
router.post('/login', limiterMiddleware, validateRequest(loginSchema), login);
router.get('/logout', logout);
router.get('/me', protect, getMe);
router.put('/settings', protect, validateRequest(updateSettingsSchema), updateSettings);

module.exports = router;


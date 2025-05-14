const express = require('express');
const router = express.Router();
const { login, register, getCurrentUser, updateProfile } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Authentication routes
router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, getCurrentUser);
router.put('/update-profile', authMiddleware, updateProfile);

module.exports = router; 
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Local Authentication
router.post('/register', userController.register);
router.post('/login', userController.login);

// TODO: OAuth routes for Google, Facebook, etc.

module.exports = router;

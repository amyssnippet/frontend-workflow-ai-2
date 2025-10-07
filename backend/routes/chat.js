const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticate } = require('../middleware');

router.post('/', authenticate, chatController.createChat);
router.get('/:chatId', authenticate, chatController.getChat);
router.post('/:chatId/messages', authenticate, chatController.addMessage);

module.exports = router;

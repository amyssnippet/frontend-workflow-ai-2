const { Chat, Message, ChatVersion } = require('../models');
const { Op } = require('sequelize');

exports.createChat = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Login required' });

    const { title, messages } = req.body;

    // Create chat
    const chat = await Chat.create({ UserId: req.user.id, title: title || 'New Chat' });

    // Create messages if provided
    if (Array.isArray(messages) && messages.length) {
      const msgs = messages.map((m) => ({ ...m, ChatId: chat.id }));
      await Message.bulkCreate(msgs);
    }

    // Create initial version
    await ChatVersion.create({
      ChatId: chat.id,
      versionNumber: 1,
      messagesSnapshot: messages || [],
    });

    res.status(201).json({ chatId: chat.id, title: chat.title });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { role, content } = req.body;

    if (!req.user) return res.status(401).json({ error: 'Login required' });
    if (!role || !content) return res.status(400).json({ error: 'Role and content required' });

    const chat = await Chat.findOne({ where: { id: chatId, UserId: req.user.id } });
    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    const message = await Message.create({ ChatId: chatId, role, content });
    
    // Update ChatVersion with new snapshot
    const messages = await Message.findAll({
      where: { ChatId: chatId },
      order: [['createdAt', 'ASC']],
    });

    // Create new version
    const latestVersion = await ChatVersion.findOne({
      where: { ChatId: chatId },
      order: [['versionNumber', 'DESC']],
    });

    await ChatVersion.create({
      ChatId: chatId,
      versionNumber: latestVersion ? latestVersion.versionNumber + 1 : 1,
      messagesSnapshot: messages.map(m => ({ role: m.role, content: m.content, createdAt: m.createdAt })),
    });

    res.status(201).json({ messageId: message.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    if (!req.user) return res.status(401).json({ error: 'Login required' });

    const chat = await Chat.findOne({ where: { id: chatId, UserId: req.user.id }, include: [ Message ] });
    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

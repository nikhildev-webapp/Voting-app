const express = require('express');
const jwt = require('jsonwebtoken');
const Poll = require('../models/Poll');
const router = express.Router();

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    req.userId = decoded.id;
    next();
  });
};

// Create a poll
router.post('/', verifyToken, async (req, res) => {
  try {
    const { question, options } = req.body;
    
    if (!question || !options || options.length < 2) {
      return res.status(400).json({ message: 'Question and at least 2 options are required' });
    }
    
    const poll = new Poll({
      question,
      options: options.map(option => ({ text: option })),
      createdBy: req.userId
    });
    
    await poll.save();
    res.status(201).json(poll);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all polls
router.get('/', async (req, res) => {
  try {
    const polls = await Poll.find().populate('createdBy', 'username');
    res.json(polls);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single poll
router.get('/:id', async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id).populate('createdBy', 'username');
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }
    res.json(poll);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Vote on a poll
router.post('/:id/vote', verifyToken, async (req, res) => {
  try {
    const { optionId } = req.body;
    
    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }
    
    const option = poll.options.id(optionId);
    if (!option) {
      return res.status(404).json({ message: 'Option not found' });
    }
    
    // Check if user already voted (you might want to implement this)
    // For now, we'll allow multiple votes
    
    option.votes += 1;
    await poll.save();
    
    res.json(poll);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
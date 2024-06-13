const express = require('express');
const { protectRoute } = require('../middlewares/protectRoute');
const { createPost } = require('../controllers/postController');

const router = express.Router();
router.get('/hello', (req, res) => {
  console.log('hello world');
  res.json({ msg: 'hello world' });
});

router.post('/create', protectRoute, createPost);

module.exports = router;

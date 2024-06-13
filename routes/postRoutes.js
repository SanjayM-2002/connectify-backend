const express = require('express');
const { protectRoute } = require('../middlewares/protectRoute');
const { createPost, getPost } = require('../controllers/postController');

const router = express.Router();
router.get('/hello', (req, res) => {
  console.log('hello world');
  res.json({ msg: 'hello world' });
});

router.post('/create', protectRoute, createPost);
router.get('/:id', protectRoute, getPost);

module.exports = router;

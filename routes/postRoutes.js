const express = require('express');
const { protectRoute } = require('../middlewares/protectRoute');
const {
  createPost,
  getPost,
  deletePost,
  likeUnlikePost,
} = require('../controllers/postController');

const router = express.Router();
router.get('/hello', (req, res) => {
  console.log('hello world');
  res.json({ msg: 'hello world' });
});

router.post('/create', protectRoute, createPost);
router.get('/:id', protectRoute, getPost);
router.delete('/:id', protectRoute, deletePost);
router.put('/like/:id', protectRoute, likeUnlikePost);

module.exports = router;

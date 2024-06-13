const express = require('express');
const { protectRoute } = require('../middlewares/protectRoute');
const {
  createPost,
  getPost,
  deletePost,
  likeUnlikePost,
  replyToPost,
  likeUnlikeReply,
  editReply,
  deleteReply,
  getFeedPosts,
  getUserPosts,
} = require('../controllers/postController');

const router = express.Router();
router.get('/hello', (req, res) => {
  console.log('hello world');
  res.json({ msg: 'hello world' });
});

router.post('/create', protectRoute, createPost);
router.get('/getPostById/:id', protectRoute, getPost);
router.delete('/:id', protectRoute, deletePost);
router.put('/like/:id', protectRoute, likeUnlikePost);
router.get('/feed', protectRoute, getFeedPosts);
router.get('/user/:username', getUserPosts);

router.put('/reply/:id', protectRoute, replyToPost);
router.put('/reply/like/:postId/:replyId', protectRoute, likeUnlikeReply);
router.put('/reply/edit/:postId/:replyId', protectRoute, editReply);
router.delete('/reply/delete/:postId/:replyId', protectRoute, deleteReply);

module.exports = router;

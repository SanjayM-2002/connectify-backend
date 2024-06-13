const express = require('express');
const {
  signUpUser,
  loginUser,
  logoutUser,
  followUnfollowUser,
  getUserProfile,
} = require('../controllers/userController');
const { protectRoute } = require('../middlewares/protectRoute');

const router = express.Router();

router.get('/hello', (req, res) => {
  console.log('hello world');
  res.json({ msg: 'hello world' });
});

router.get('/profile/:query', protectRoute, getUserProfile);
router.post('/signup', signUpUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/follow/:id', protectRoute, followUnfollowUser);

module.exports = router;

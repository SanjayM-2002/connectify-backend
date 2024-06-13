const express = require('express');
const { signUpUser, loginUser } = require('../controllers/userController');

const router = express.Router();

router.get('/hello', (req, res) => {
  console.log('hello world');
  res.json({ msg: 'hello world' });
});

router.post('/signup', signUpUser);
router.post('/login', loginUser);

module.exports = router;

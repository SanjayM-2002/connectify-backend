const express = require('express');

const router = express.Router();

router.get('/hello', (req, res) => {
  console.log('hello world');
  res.json({ msg: 'hello world' });
});

module.exports = router;

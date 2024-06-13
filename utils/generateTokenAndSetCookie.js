const jwt = require('jsonwebtoken');

const generateTokenAndSetCookie = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '5d',
  });
  res.cookie('jwt', token, {
    httpOnly: true, //secure
    maxAge: 5 * 24 * 60 * 60 * 1000, // 5 days
    sameSite: 'strict', // protection
  });

  return token;
};

module.exports = { generateTokenAndSetCookie };

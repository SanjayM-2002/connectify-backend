const jwt = require('jsonwebtoken');
const { User } = require('../models/userModel');

const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      return res.status(400).json({ message: 'Unauthorised user' });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decodedToken.userId).select('-password');
    // console.log('user object is: ', user);
    req.user = user;
    // console.log('Middleware function returned successfully');
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
    console.log('Error in auth middleware', err.message);
  }
};

module.exports = { protectRoute };

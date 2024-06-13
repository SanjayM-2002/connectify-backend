const z = require('zod');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models/userModel');
const {
  generateTokenAndSetCookie,
} = require('../utils/generateTokenAndSetCookie');

const mobileNumberRegex = /^[0-9]{10}$/;

const signupSchema = z.object({
  fullname: z.string(),
  mobileNumber: z.string().refine((val) => mobileNumberRegex.test(val), {
    message: 'Invalid mobile number format',
  }),
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
});
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const saltRounds = parseInt(process.env.SALTROUNDS);
const jwtSecret = process.env.JWT_SECRET;

const signUpUser = async (req, res) => {
  try {
    const inputData = req.body;
    const zodResponse = signupSchema.safeParse(inputData);
    const dataResponse = zodResponse.data;
    if (!zodResponse.success) {
      res.status(401).json({ error: zodResponse.error });
      return;
    }
    const email = dataResponse.email;
    const username = dataResponse.username;

    const user = await User.findOne({ $or: [{ email }, { username }] });

    if (user) {
      console.log('User already exists');
      return res.status(400).json({ error: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dataResponse.password, salt);
    const newUser = new User({
      fullname: dataResponse.fullname,
      email: dataResponse.email,
      mobileNumber: dataResponse.mobileNumber,
      username: dataResponse.username,
      password: hashedPassword,
    });
    await newUser.save();
    if (newUser) {
      generateTokenAndSetCookie(newUser._id, res);
      res.status(201).json({
        _id: newUser._id,
        fullname: newUser.fullname,
        mobileNumber: newUser.mobileNumber,
        email: newUser.email,
        username: newUser.username,
        bio: newUser.bio,
        profilePic: newUser.profilePic,
      });
      console.log('Successfully signed up');
    } else {
      res.status(400).json({ error: 'Invalid user data' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log('Error in signup user ', err.message);
  }
};

const loginUser = async (req, res) => {
  try {
    const inputData = req.body;
    const zodResponse = loginSchema.safeParse(inputData);
    const dataResponse = zodResponse.data;
    if (!zodResponse.success) {
      res.status(401).json({ error: zodResponse.error });
      return;
    }
    const email = dataResponse.email;
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Invalid email');
      return res.status(400).json({ error: 'Invalid email' });
    }

    const isPasswordCorrect = await bcrypt.compare(
      dataResponse.password,
      user.password
    );

    if (!isPasswordCorrect) {
      console.log('Invalid password');
      return res.status(400).json({ error: 'Invalid password' });
    }

    generateTokenAndSetCookie(user._id, res);
    res.status(200).json({
      _id: user._id,
      fullname: user.fullname,
      mobileNumber: user.mobileNumber,
      email: user.email,
      username: user.username,
      bio: user.bio,
      profilePic: user.profilePic,
    });
    console.log('Logged in successfully');
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log('Error in login user', err.message);
  }
};

module.exports = { signUpUser, loginUser };

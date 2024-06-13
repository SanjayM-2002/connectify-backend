const z = require('zod');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models/userModel');
const {
  generateTokenAndSetCookie,
} = require('../utils/generateTokenAndSetCookie');
const { mongoose } = require('mongoose');

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

const logoutUser = async (req, res) => {
  try {
    res.cookie('jwt', '', { maxAge: 1 });
    res.status(200).json({ message: 'Logged out successfully' });
    console.log('Logged out successfully');
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log('Error in logout', err.message);
  }
};

const followUnfollowUser = async (req, res) => {
  try {
    const id = req.params.id;
    console.log('id from req params is: ', id);
    const userToModify = await User.findById(id);
    const currentUser = await User.findById(req.user._id);

    if (!userToModify) {
      return res.status(401).json({ error: 'Invalid user' });
    }
    if (!currentUser) {
      return res.status(401).json({ error: 'Invalid user' });
    }
    if (id === req.user._id.toString()) {
      return res
        .status(400)
        .json({ error: 'You cannot follow or unfollow yourself' });
    }

    const isFollowing = currentUser.following.includes(id);
    if (isFollowing) {
      //Unfollow
      //Modify following array of currentUser (delete)
      //Modify followers array of userToModify (delete)

      await User.findByIdAndUpdate(req.user._id, {
        $pull: { following: id },
      });
      await User.findByIdAndUpdate(id, {
        $pull: { followers: req.user._id },
      });
      res.status(200).json({ message: 'User unfollowed successfully' });
    } else {
      //Follow
      //Modify following array of currentUser (add)
      //Modify followers array of userToModify (add)

      await User.findByIdAndUpdate(req.user._id, {
        $push: { following: id },
      });
      await User.findByIdAndUpdate(id, {
        $push: { followers: req.user._id },
      });
      res.status(200).json({ message: 'User followed successfully' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log('Error in follow or unfollow', err.message);
  }
};

const getUserProfile = async (req, res) => {
  const { query } = req.params;
  try {
    let user;
    if (mongoose.Types.ObjectId.isValid(query)) {
      user = await User.findOne({ _id: query })
        .select('-password')
        .select('-updatedAt');
    } else {
      user = await User.findOne({ username: query })
        .select('-password')
        .select('-updatedAt');
    }
    // console.log('User is: ', user);
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('User found');
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log('Error in getting user-profile', err.message);
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password -updatedAt');
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log('Error in getting list of users', err.message);
  }
};

const searchUser = async (req, res) => {
  const { query } = req.params;
  try {
    const users = await User.find(
      {
        $or: [
          { username: { $regex: query, $options: 'i' } }, // Case-insensitive search
          { fullname: { $regex: query, $options: 'i' } },
        ],
      },
      '-password -updatedAt'
    );
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log('Error in searching users', err.message);
  }
};

module.exports = {
  signUpUser,
  loginUser,
  logoutUser,
  followUnfollowUser,
  getUserProfile,
  getAllUsers,
  searchUser,
};

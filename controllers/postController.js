const { Post } = require('../models/postModel');
const { User } = require('../models/userModel');
const { protectRoute } = require('../middlewares/protectRoute');
const cloudinary = require('cloudinary').v2;

const createPost = async (req, res) => {
  try {
    const { postedBy, text, hashtags } = req.body;
    let { image } = req.body;

    if (!postedBy || !text) {
      return res
        .status(400)
        .json({ error: 'PostedBy and Text fields are required' });
    }
    const user = await User.findById(postedBy);
    console.log('User data from middleware is: ', req.user._id.toString());
    console.log('User data extracted from postedBy is: ', user);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user._id.toString() !== req.user._id.toString()) {
      return res.status(401).json({ error: 'Unauthorized to create post' });
    }

    const maxLength = 500;
    if (text.length > maxLength) {
      return res
        .status(400)
        .json({ error: `Text must be less than ${maxLength} characters` });
    }

    if (image) {
      const uploadedResponse = await cloudinary.uploader.upload(image);
      image = uploadedResponse.secure_url;
    }

    let processedHashtags = [];
    if (hashtags && Array.isArray(hashtags)) {
      processedHashtags = hashtags.map((tag) => tag.trim());
    }

    const newPost = new Post({
      postedBy,
      text,
      image,
      hashtags: processedHashtags,
    });
    await newPost.save();
    console.log('New post created successfully');
    console.log('New post is: ', newPost);
    res.status(201).json(newPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log('Error in creating post', err.message);
  }
};

module.exports = { createPost };

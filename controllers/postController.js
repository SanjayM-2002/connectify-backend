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

const getPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const viewerId = req.user._id;
    console.log('post id from req param is: ', postId);
    const post = await Post.findById(postId);

    if (!post) {
      console.log('Post does not exist');
      return res.status(400).json({ error: 'Post does not exist' });
    }
    const authorId = post.postedBy.toString();
    if (authorId !== viewerId.toString()) {
      if (!post.viewedBy.includes(viewerId.toString())) {
        post.viewedBy.push(viewerId);
      }

      post.viewCount = post.viewedBy.length;
    }
    await post.save();

    console.log('Post found');
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log('Error in creating post', err.message);
  }
};

const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    console.log('Post id from req params is: ', postId);
    const post = await Post.findById(postId);

    if (!post) {
      console.log('Post not found');
      return res.status(400).json({ error: 'Post not found' });
    }

    console.log('Data from middleware: ', req.user);

    if (post.postedBy.toString() !== req.user._id.toString()) {
      console.log('You cant delete post created by others');
      return res
        .status(401)
        .json({ error: 'You cant delete post created by others' });
    }

    await Post.findByIdAndDelete(post);
    if (post.image) {
      const imageId = post.image.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(imageId);
    }
    console.log('Post deleted successfully');
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log('Error in deleting post', err.message);
  }
};

module.exports = { createPost, getPost, deletePost };

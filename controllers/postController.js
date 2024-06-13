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

const likeUnlikePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;
    const post = await Post.findById(postId);

    if (!post) {
      console.log('Post not found');
      return res.status(404).json({ error: 'Post not found' });
    }
    const authorId = post.postedBy.toString();
    if (authorId !== userId.toString()) {
      if (!post.viewedBy.includes(userId.toString())) {
        post.viewedBy.push(userId);
      }

      post.viewCount = post.viewedBy.length;
    }
    await post.save();

    const userLikedPost = await post.likes.includes(userId);
    if (userLikedPost) {
      //Unlike
      await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
      console.log('Unliked successfully');
      res.status(200).json({ message: 'Unliked successfully' });
    } else {
      //Like
      post.likes.push(userId);
      await post.save();
      console.log('Liked successfully');
      res.status(200).json({ message: 'Liked successfully' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log('Error in liking/unliking post', err.message);
  }
};

const getFeedPosts = async (req, res) => {
  try {
    console.log('check');
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ error: 'User not found' });
    }

    const userFollowing = user.following;
    const feedPosts = await Post.find({
      postedBy: { $in: userFollowing },
    }).sort({ createdAt: -1 });
    console.log(
      'Posts of following will be obtained in descending order according to posted date'
    );
    res.status(200).json(feedPosts);
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log('Error in getting feed posts', err.message);
  }
};

const getUserPosts = async (req, res) => {
  try {
    const username = req.params.username;

    const user = await User.findOne({ username: username });
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ error: 'User not found' });
    }

    const posts = await Post.find({ postedBy: user._id }).sort({
      createdAt: -1,
    });
    console.log('No error');
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log('Error in creating post', err.message);
  }
};

const replyToPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { text } = req.body;
    const userId = req.user._id;
    const username = req.user.username;
    const fullname = req.user.fullname;
    const userProfilePic = req.user.profilePic;

    if (!text) {
      console.log('Text field is required');
      return res.status(400).json({ error: 'Text field is required' });
    }

    const post = await Post.findById(postId);

    if (!post) {
      console.log('Post not found');
      return res.status(404).json({ messagfe: 'Post not found' });
    }
    const authorId = post.postedBy.toString();
    if (authorId !== userId.toString()) {
      if (!post.viewedBy.includes(userId.toString())) {
        post.viewedBy.push(userId);
      }

      post.viewCount = post.viewedBy.length;
    }
    await post.save();
    const newReply = { text, userId, username, userProfilePic, fullname };
    console.log('New reply is: ', newReply);
    post.replies.push(newReply);
    await post.save();
    console.log('Reply added successfully');
    res.status(200).json(newReply);
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log('Error in replying to a post', err.message);
  }
};

const likeUnlikeReply = async (req, res) => {
  try {
    const postId = req.params.postId;
    const replyId = req.params.replyId;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    const authorId = post.postedBy.toString();
    if (authorId !== userId.toString()) {
      if (!post.viewedBy.includes(userId.toString())) {
        post.viewedBy.push(userId);
      }

      post.viewCount = post.viewedBy.length;
    }
    await post.save();
    const reply = post.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ error: 'Reply not found' });
    }

    const userLikedReply = reply.likes.includes(userId);

    if (userLikedReply) {
      // Unlike Reply
      reply.likes.pull(userId);
      await post.save();
      console.log('Unliked reply successfully');
      return res.status(200).json({ message: 'Unliked reply successfully' });
    } else {
      // Like Reply
      reply.likes.push(userId);
      await post.save();
      console.log('Liked reply successfully');
      return res.status(200).json({ message: 'Liked reply successfully' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log('Error in liking/unliking reply', err.message);
  }
};

const editReply = async (req, res) => {
  try {
    const postId = req.params.postId;
    const replyId = req.params.replyId;
    const { text } = req.body;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const reply = post.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ error: 'Reply not found' });
    }

    if (reply.userId.toString() !== userId.toString()) {
      return res.status(401).json({ error: 'Unauthorized to edit reply' });
    }

    reply.text = text;
    await post.save();
    console.log('Edited reply successfully');
    return res.status(200).json({ message: 'Edited reply successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log('Error in editing reply', err.message);
  }
};

const deleteReply = async (req, res) => {
  try {
    const postId = req.params.postId;
    const replyId = req.params.replyId;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const reply = post.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ error: 'Reply not found' });
    }

    if (reply.userId.toString() !== userId.toString()) {
      return res.status(401).json({ error: 'Unauthorized to delete reply' });
    }

    await Post.findByIdAndUpdate(postId, {
      $pull: { replies: { _id: replyId } },
    });

    console.log('Deleted reply successfully');
    return res.status(200).json({ message: 'Deleted reply successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log('Error in deleting reply', err.message);
  }
};

module.exports = {
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
};

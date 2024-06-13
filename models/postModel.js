const mongoose = require('mongoose');
const postSchema = mongoose.Schema(
  {
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      maxLength: 500,
    },
    image: {
      type: String,
    },
    likes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    hashtags: {
      type: [String],
      default: [],
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    viewedBy: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    replies: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        text: {
          type: String,
          maxLength: 500,
          required: true,
        },
        userProfilePic: {
          type: String,
        },
        username: {
          type: String,
        },
        fullname: {
          type: String,
        },
        likes: {
          type: [mongoose.Schema.Types.ObjectId],
          ref: 'User',
          default: [],
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Post = mongoose.model('Post', postSchema);

module.exports = { Post };

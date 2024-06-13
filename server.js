const express = require('express');
const dotenv = require('dotenv');
const cloudinary = require('cloudinary').v2;

dotenv.config();

const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDb = require('./db/connectDb');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');

const PORT = process.env.PORT;

const app = express();
connectDb();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.get('/', (req, res) => {
  res.json({ msg: 'hello' });
});

app.use('/api/v1/users', userRoutes);
app.use('/api/v1/posts', postRoutes);

app.listen(PORT, () => {
  console.log(`express app listening on port ${PORT}`);
});

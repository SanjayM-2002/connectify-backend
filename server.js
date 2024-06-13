const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const cors = require('cors');
const connectDb = require('./db/connectDb');
const userRoutes = require('./routes/userRoutes');

const PORT = process.env.PORT;

const app = express();
connectDb();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ msg: 'hello' });
});

app.use('/api/v1/users', userRoutes);

app.listen(PORT, () => {
  console.log(`express app listening on port ${PORT}`);
});

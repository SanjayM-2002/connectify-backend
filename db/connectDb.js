const mongoose = require('mongoose');
const connectDb = async () => {
  const mongoUrl = process.env.MONGO_URL;
  console.log('url is: ', mongoUrl);
  // console.log(mongoUrl);
  try {
    await mongoose.connect(mongoUrl);
    console.log(`Mongo connected to ${mongoUrl}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};
module.exports = connectDb;

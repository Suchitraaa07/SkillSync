const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set in environment variables.");
  }

  if (uri.includes("<db_password>") || uri.includes("<username>")) {
    throw new Error(
      "MONGODB_URI contains placeholder values. Replace <username>/<db_password> with real credentials."
    );
  }

  await mongoose.connect(uri);
  console.log("MongoDB connected");
};

module.exports = { connectDB };

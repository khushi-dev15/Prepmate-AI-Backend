import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error("MONGODB_URI environment variable is not set. Please check your environment variables.");
    }

    await mongoose.connect(mongoURI);
    console.log("MongoDB connected ✅");
  } catch (err) {
    console.error("MongoDB connection failed ❌", err.message);
    process.exit(1); // crash if DB not connected
  }
};

export default connectDB;

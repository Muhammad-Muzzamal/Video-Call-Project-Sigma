import mongoose from "mongoose";
import { ENV } from "./env.config.js";


const connectDB = async () => {
  try {
    await mongoose.connect(ENV.MONGO_URI);
    console.log("Connected to the database successfully");
  } catch (error) {
    console.error("Error connecting to the database", error);
    process.exit(1);
  }
};

export { connectDB };

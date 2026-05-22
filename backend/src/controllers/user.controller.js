import bcrypt from "bcrypt";
import crypto from "crypto";
import { User } from "../models/user.model.js";

/**
 * @desc    Register a new user
 * @route   POST /api/users/register
 * @access  Public
 */

export const register = async (req, res) => {
  const { name, username, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: "Username already exists",
        status_code: 400,
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      name: name,
      username: username,
      password: hashPassword,
    });
    // save user
    await newUser.save();

    return res.status(201).json({
      status: "success",
      message: "User registered successfully",
      data: {
        user: newUser,
      },
      status_code: 201,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      status_code: 500,
    });
  }
};

/**
 * @desc    Login a user
 * @route   POST /api/users/login
 * @access  Public
 */
export const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        status: "error",
        message: "Username and password are required",
        status_code: 400,
      });
    }

    const user = await User.findOne({ username }).select("+password");

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "Invalid username or password",
        status_code: 404,
      });
    }

    const isMatched = await bcrypt.compare(password, user.password);

    if (!isMatched) {
      return res.status(401).json({
        status: "error",
        message: "Invalid username or password",
        status_code: 401,
      });
    }

    if (isMatched) {
      let token = crypto.randomBytes(20).toString("hex");
      user.token = token;
      await user.save();
      return res.status(200).json({
        status: "success",
        message: "User logged in successfully",
        data: {
          user: user,
        },
        status_code: 200,
      });
    }

  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      status_code: 500,
    });
  }
};

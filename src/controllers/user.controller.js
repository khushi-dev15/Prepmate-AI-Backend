import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createUser, findOneUser } from "../dao/user.dao.js";

export const registerController = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: "All fields required" });

    const existing = await findOneUser({ email });
    if (existing) return res.status(400).json({ message: "User exists" });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = await createUser({ username, email, password: hashed });

    const token = jwt.sign({ _id: newUser._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.cookie("token", token, { httpOnly: true, sameSite: "lax" });

    res.status(201).json({ success: true, user: { id: newUser._id, username, email }, token });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email & password required" });

    const user = await findOneUser({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.cookie("token", token, { httpOnly: true, sameSite: "lax" });

    res.status(200).json({ success: true, user: { id: user._id, username: user.username, email }, token });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

import bcrypt from "bcrypt";
import Users from "../models/users.js";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/jwt.js";

export default async function loginUser(req, res) {
  const { password, email } = req.body;

  if (!password || !email) {
    return res
      .status(400)
      .json({ message: "email and password are required." });
  }

  try {
    const user = await Users.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    console.log(`User ${user.name} logged in successfully.`);

    // Generate a JWT token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res
      .status(200)
      .json({
        message: "Login successful.",
        user: { id: user.id, name: user.name, email: user.email },
        token: token,
      });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ message: "Internal server error." });
  }
}

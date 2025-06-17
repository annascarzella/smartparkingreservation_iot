import bcrypt from "bcrypt";
import Users from "../models/users.js";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/jwt.js";

export default async function loginUser(req) {
  const { password, email } = req.body;

  if (!password || !email) {
    return {
      status: 400,
      body: { message: "email and password are required." },
    };
  }

  try {
    const user = await Users.findOne({ where: { email } });
    if (!user) {
      return {
        status: 401,
        body: { message: "Invalid email or password." },
      };
    }
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      console.log(`Invalid password for user with email: ${email}`);
      return {
        status: 401,
        body: { message: "Invalid email or password." },
      };
    }
    console.log(`User ${user.name} logged in successfully.`);

    // Generate a JWT token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "1h",
    });

    return {
      status: 200,
      body: {
      message: "Login successful.",
      user: { id: user.id, name: user.name, email: user.email },
      token: token,
      },
    };
  } catch (error) {
    console.error("Error logging in user:", error);
    return {
      status: 500,
      body: { message: "Internal server error." },
    };
  }
}

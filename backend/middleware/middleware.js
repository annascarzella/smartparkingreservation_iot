import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

export default function authMiddleware(req, res, next) {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (token === undefined) throw new Error("Access Denied");

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.id = verified.id;
    next();
  } catch (err) {
    throw new Error("Invalid token");
  }
}

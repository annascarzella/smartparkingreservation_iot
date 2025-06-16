import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/jwt.js";

export default function authMiddleware(req, res, next) {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (token === undefined) throw new Error("Access Denied");

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.userId = verified.id;
    next();
  } catch (err) {
    throw new Error("Invalid token");
  }
}

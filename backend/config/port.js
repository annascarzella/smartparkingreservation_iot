import dotenv from "dotenv";
dotenv.config();

export const PORT = process.env.BACKEND_PORT || 5000;

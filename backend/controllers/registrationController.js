import bcrypt from 'bcrypt';
import { User } from '../models/user.js';

export async function registerUser(req, res) {
  const { name, password, email } = req.body;

  if (!name || !password || !email) {
    return res.status(400).json({ message: 'name, password and email are required.' });
  }

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
        return res.status(400).json({ message: 'Email already registered.' });
  }

  try {
    console.log(`Registering user: ${name}`);
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      email,
      password_hash: hashedPassword,
    });

    res.status(201).json({ message: 'User registered successfully.' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
}
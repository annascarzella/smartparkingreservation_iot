import bcrypt from 'bcrypt';
import Users from '../models/users.js';

export default async function registerUser(req) {
  const { name, password, email } = req.body;

  if (!name || !password || !email) {
    return { status: 400, message: 'name, password and email are required.' };
  }

  const existingUser = await Users.findOne({ where: { email } });
  if (existingUser) {
    return { status: 400, message: 'Email already registered.' };
  }

  try {
    console.log(`Registering user: ${name}`);
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await Users.create({
      name,
      email,
      password_hash: hashedPassword,
    });

    return { status: 201, message: 'User registered successfully.' };
  } catch (error) {
    console.error('Error registering user:', error);
    return { status: 500, message: 'Internal server error.' };
  }
}
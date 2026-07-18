import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { config } from '../config/env';

export class AuthService {
  static generateToken(userId: string): string {
    return jwt.sign({ id: userId }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
    });
  }

  static async registerUser(data: Partial<IUser>): Promise<{ user: IUser; token: string }> {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Note: In a real app we'd hash the password here if not handled by a pre-save hook.
    // For simplicity, we assume data.password is passed, we hash it.
    const bcrypt = require('bcrypt');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash((data as any).password, salt);

    const user = await User.create({
      name: data.name,
      email: data.email,
      passwordHash,
    });

    const token = this.generateToken(user._id.toString());
    return { user, token };
  }

  static async loginUser(email: string, password: string): Promise<{ user: IUser; token: string }> {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken(user._id.toString());
    return { user, token };
  }
}

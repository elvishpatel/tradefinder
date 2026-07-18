import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    defaultTimeframe: string;
    notifications: {
      browser: boolean;
      email: boolean;
    };
  };
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    preferences: {
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'dark' },
      defaultTimeframe: { type: String, default: '1D' },
      notifications: {
        browser: { type: Boolean, default: true },
        email: { type: Boolean, default: false },
      },
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User = mongoose.model<IUser>('User', userSchema);

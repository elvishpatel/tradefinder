"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const env_1 = require("../config/env");
class AuthService {
    static generateToken(userId) {
        return jsonwebtoken_1.default.sign({ id: userId }, env_1.config.jwtSecret, {
            expiresIn: env_1.config.jwtExpiresIn,
        });
    }
    static async registerUser(data) {
        const existingUser = await User_1.User.findOne({ email: data.email });
        if (existingUser) {
            throw new Error('User already exists');
        }
        // Note: In a real app we'd hash the password here if not handled by a pre-save hook.
        // For simplicity, we assume data.password is passed, we hash it.
        const bcrypt = require('bcrypt');
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(data.password, salt);
        const user = await User_1.User.create({
            name: data.name,
            email: data.email,
            passwordHash,
        });
        const token = this.generateToken(user._id.toString());
        return { user, token };
    }
    static async loginUser(email, password) {
        const user = await User_1.User.findOne({ email });
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
exports.AuthService = AuthService;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const express_validator_1 = require("express-validator");
const auth_service_1 = require("../services/auth.service");
class AuthController {
    static async register(req, res, next) {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, errors: errors.array() });
            return;
        }
        try {
            const { user, token } = await auth_service_1.AuthService.registerUser(req.body);
            res.status(201).json({
                success: true,
                data: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                },
                token,
            });
        }
        catch (error) {
            if (error.message === 'User already exists') {
                res.status(400).json({ success: false, message: error.message });
            }
            else {
                next(error);
            }
        }
    }
    static async login(req, res, next) {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, errors: errors.array() });
            return;
        }
        try {
            const { email, password } = req.body;
            const { user, token } = await auth_service_1.AuthService.loginUser(email, password);
            res.status(200).json({
                success: true,
                data: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                },
                token,
            });
        }
        catch (error) {
            if (error.message === 'Invalid credentials') {
                res.status(401).json({ success: false, message: error.message });
            }
            else {
                next(error);
            }
        }
    }
    static async getProfile(req, res, next) {
        try {
            // req.user is set by authMiddleware
            const user = req.user;
            res.status(200).json({
                success: true,
                data: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    preferences: user.preferences
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;

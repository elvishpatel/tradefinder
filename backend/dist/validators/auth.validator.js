"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginValidator = exports.registerValidator = void 0;
const express_validator_1 = require("express-validator");
exports.registerValidator = [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Name is required').trim(),
    (0, express_validator_1.body)('email').isEmail().withMessage('Please include a valid email').normalizeEmail(),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
];
exports.loginValidator = [
    (0, express_validator_1.body)('email').isEmail().withMessage('Please include a valid email').normalizeEmail(),
    (0, express_validator_1.body)('password').exists().withMessage('Password is required'),
];

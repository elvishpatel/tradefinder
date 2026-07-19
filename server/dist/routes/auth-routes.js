"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_controller_1 = __importDefault(require("../controllers/auth-controller"));
const auth_1 = __importDefault(require("../middleware/auth"));
const validate_1 = __importDefault(require("../middleware/validate"));
const router = (0, express_1.Router)();
router.post('/register', [
    (0, express_validator_1.body)('email').isEmail().withMessage('Enter a valid email address').normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    validate_1.default,
], auth_controller_1.default.register);
router.post('/login', [
    (0, express_validator_1.body)('email').isEmail().withMessage('Enter a valid email address').normalizeEmail(),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
    validate_1.default,
], auth_controller_1.default.login);
// Protected App Auth Routes
router.get('/me', auth_1.default, auth_controller_1.default.me);
// Fyers Integration Routes
router.get('/fyers/url', auth_1.default, auth_controller_1.default.getFyersUrl);
router.get('/fyers/session', auth_1.default, auth_controller_1.default.getFyersSession);
router.post('/fyers/disconnect', auth_1.default, auth_controller_1.default.disconnectFyers);
// Public Fyers OAuth Callback (invoked by FYERS authorization server redirect)
router.get('/fyers/callback', auth_controller_1.default.fyersCallback);
exports.default = router;

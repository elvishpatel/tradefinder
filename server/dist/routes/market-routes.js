"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const market_controller_1 = __importDefault(require("../controllers/market-controller"));
const auth_1 = __importDefault(require("../middleware/auth"));
const router = (0, express_1.Router)();
// Secure all market metrics routes behind authGuard
router.use(auth_1.default);
router.get('/dashboard', market_controller_1.default.getDashboard);
router.get('/sectors', market_controller_1.default.getSectors);
router.get('/sectors/:name', market_controller_1.default.getSectorDetails);
router.get('/scanner/:type', market_controller_1.default.getScannerResults);
exports.default = router;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketController = void 0;
const market_engine_1 = __importDefault(require("../engines/market-engine"));
const logger_1 = __importDefault(require("../utils/logger"));
class MarketController {
    getDashboard(req, res) {
        try {
            const data = market_engine_1.default.getDashboardData();
            return res.json(data);
        }
        catch (err) {
            logger_1.default.error(`Error in getDashboard: ${err.message}`);
            return res.status(500).json({ error: { message: 'Failed to fetch dashboard data' } });
        }
    }
    getSectors(req, res) {
        try {
            const data = market_engine_1.default.getSectorAnalysisList();
            return res.json(data);
        }
        catch (err) {
            logger_1.default.error(`Error in getSectors: ${err.message}`);
            return res.status(500).json({ error: { message: 'Failed to fetch sectors performance data' } });
        }
    }
    getSectorDetails(req, res) {
        const { name } = req.params;
        try {
            const data = market_engine_1.default.getSectorDetails(name);
            if (!data) {
                return res.status(404).json({ error: { message: `Sector ${name} not found` } });
            }
            return res.json(data);
        }
        catch (err) {
            logger_1.default.error(`Error in getSectorDetails for ${name}: ${err.message}`);
            return res.status(500).json({ error: { message: 'Failed to fetch sector details' } });
        }
    }
    getScannerResults(req, res) {
        const { type } = req.params; // LONG or SHORT
        const scannerType = type?.toUpperCase() === 'SHORT' ? 'SHORT' : 'LONG';
        try {
            const data = market_engine_1.default.getScannerResults(scannerType);
            return res.json(data);
        }
        catch (err) {
            logger_1.default.error(`Error in getScannerResults for ${scannerType}: ${err.message}`);
            return res.status(500).json({ error: { message: 'Failed to fetch scanner results' } });
        }
    }
}
exports.MarketController = MarketController;
exports.default = new MarketController();

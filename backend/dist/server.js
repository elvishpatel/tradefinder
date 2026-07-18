"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const socket_io_1 = require("socket.io");
const env_1 = require("./config/env");
const database_1 = require("./config/database");
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const fyersSocket_service_1 = require("./services/fyersSocket.service");
// Initialize Database
(0, database_1.connectDB)();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Initialize Socket.io
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*', // TODO: Update with frontend URL in production
        methods: ['GET', 'POST'],
    },
});
exports.io = io;
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Health Check Route
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'TradeFinder API is running' });
});
// API Routes
app.use('/api/auth', auth_routes_1.default);
// Socket.io Connection
io.on('connection', (socket) => {
    logger_1.logger.info(`New client connected: ${socket.id}`);
    socket.on('disconnect', () => {
        logger_1.logger.info(`Client disconnected: ${socket.id}`);
    });
});
// Error Handling Middleware
app.use(errorHandler_1.notFound);
app.use(errorHandler_1.errorHandler);
// Start Server
const PORT = env_1.config.port;
server.listen(PORT, () => {
    logger_1.logger.info(`Server running in ${env_1.config.nodeEnv} mode on port ${PORT}`);
    // Start Fyers WS Connection
    fyersSocket_service_1.fyersSocketService.connect();
});

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.server = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const config_1 = __importDefault(require("./config"));
const logger_1 = __importDefault(require("./utils/logger"));
const auth_routes_1 = __importDefault(require("./routes/auth-routes"));
const market_routes_1 = __importDefault(require("./routes/market-routes"));
const market_stream_1 = __importDefault(require("./socket/market-stream"));
const app = (0, express_1.default)();
exports.app = app;
const server = http_1.default.createServer(app);
exports.server = server;
// Socket.IO Server configuration
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*', // We can restrict this in production
        methods: ['GET', 'POST'],
    },
});
exports.io = io;
// Initialize market streaming
const marketStream = new market_stream_1.default(io);
marketStream.start().then(() => {
    logger_1.default.info('Live market feed initialized.');
}).catch((err) => {
    logger_1.default.error('Failed to start live market feed:', err.message);
});
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: '*' }));
app.use(express_1.default.json());
// Route bindings
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/market', market_routes_1.default);
// Request logging middleware
app.use((req, res, next) => {
    logger_1.default.http(`${req.method} ${req.url}`);
    next();
});
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'UP',
        timestamp: new Date().toISOString(),
        environment: config_1.default.NODE_ENV,
    });
});
// Basic error handler
app.use((err, req, res, next) => {
    logger_1.default.error(`${err.message} - ${req.originalUrl} - ${req.ip}`);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
        },
    });
});
// Socket connection logic
io.on('connection', (socket) => {
    logger_1.default.info(`Client connected: ${socket.id}`);
    socket.on('disconnect', () => {
        logger_1.default.info(`Client disconnected: ${socket.id}`);
    });
});
// Start listening
const PORT = config_1.default.PORT;
server.listen(PORT, () => {
    logger_1.default.info(`Server running in ${config_1.default.NODE_ENV} mode on port ${PORT}`);
});
exports.default = server;

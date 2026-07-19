import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import config from './config';
import logger from './utils/logger';
import authRouter from './routes/auth-routes';
import marketRouter from './routes/market-routes';
import MarketStream from './socket/market-stream';

const app = express();
const server = http.createServer(app);

// Socket.IO Server configuration
const io = new Server(server, {
  cors: {
    origin: '*', // We can restrict this in production
    methods: ['GET', 'POST'],
  },
});

// Initialize market streaming
const marketStream = new MarketStream(io);
marketStream.start().then(() => {
  logger.info('Live market feed initialized.');
}).catch((err) => {
  logger.error('Failed to start live market feed:', err.message);
});

// Middleware
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());


// Route bindings
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/market', marketRouter);


// Request logging middleware
app.use((req, res, next) => {
  logger.http(`${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
  });
});

// Basic error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`${err.message} - ${req.originalUrl} - ${req.ip}`);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
    },
  });
});

// Socket connection logic
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Start listening
const PORT = config.PORT;
server.listen(PORT, () => {
  logger.info(`Server running in ${config.NODE_ENV} mode on port ${PORT}`);
});

export { app, server, io };
export default server;

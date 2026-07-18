import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { Server } from 'socket.io';
import { config } from './config/env';
import { connectDB } from './config/database';
import { logger } from './utils/logger';
import { errorHandler, notFound } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import { fyersSocketService } from './services/fyersSocket.service';

// Initialize Database
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*', // TODO: Update with frontend URL in production
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Route
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'TradeFinder API is running' });
});

// API Routes
app.use('/api/auth', authRoutes);

// Socket.io Connection
io.on('connection', (socket) => {
  logger.info(`New client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Export io for use in other files (like controllers or services)
export { io };

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Start Server
const PORT = config.port;
server.listen(PORT, () => {
  logger.info(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
  
  // Start Fyers WS Connection
  fyersSocketService.connect();
});

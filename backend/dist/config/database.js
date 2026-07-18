"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("../utils/logger");
const env_1 = require("./env");
const connectDB = async () => {
    try {
        const conn = await mongoose_1.default.connect(env_1.config.mongoUri);
        logger_1.logger.info(`MongoDB Connected: ${conn.connection.host}`);
    }
    catch (error) {
        logger_1.logger.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1); // Exit process with failure
    }
};
exports.connectDB = connectDB;

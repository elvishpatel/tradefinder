"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = exports.errorHandler = void 0;
const express_1 = require("express");
const logger_1 = require("../utils/logger");
const env_1 = require("../config/env");
const errorHandler = (err, req, res, next) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message;
    // Handle Mongoose bad ObjectId
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        message = 'Resource not found';
        statusCode = 404;
    }
    logger_1.logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    res.status(statusCode).json({
        success: false,
        message,
        stack: env_1.config.nodeEnv === 'production' ? null : err.stack,
    });
};
exports.errorHandler = errorHandler;
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};
exports.notFound = notFound;
//# sourceMappingURL=errorHandler.js.map
import express from "express";
import cors from "cors";
import 'dotenv/config';
import { clerkMiddleware } from '@clerk/express';
import aiRouter from "./routes/aiRoutes.js";
import userRouter from "./routes/userRoutes.js";
import logger from './configs/logger.js';
import connectCloudinary from './configs/cloudinary.js';

const app = express();

await connectCloudinary();

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

// 请求日志中间件
app.use((req, res, next) => {
    const startTime = Date.now();

    logger.debug('📥 NEW REQUEST', {
        method: req.method,
        url: req.url,
        path: req.path,
        body: req.body,
        contentType: req.headers['content-type'],
        userAgent: req.headers['user-agent'],
        ip: req.ip
    });

    // 记录响应
    const originalSend = res.send;
    res.send = function (data) {
        logger.debug('📤 RESPONSE', {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            processingTime: Date.now() - startTime,
            responseSize: data ? data.length : 0
        });
        return originalSend.call(this, data);
    };

    next();
});

// 根路由
app.get('/', (req, res) => {
    logger.info('Root route accessed');
    res.send('Server is running');
});

// AI 路由
app.use('/api/ai', aiRouter);

// 用户路由
app.use('/api/user', userRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.info('🚀 Server started', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
});
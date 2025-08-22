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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 调试中间件 - 检查请求体解析
app.use((req, res, next) => {
    if (req.url.includes('/generate-article')) {
        logger.info('🔍 REQUEST BODY CHECK', {
            method: req.method,
            url: req.url,
            hasBody: !!req.body,
            bodyType: typeof req.body,
            bodyKeys: req.body ? Object.keys(req.body) : [],
            bodyContent: req.body,
            contentType: req.headers['content-type'],
            contentLength: req.headers['content-length']
        });
    }
    next();
});

app.use(clerkMiddleware());

// 其余配置...
app.use('/api/ai', aiRouter);
app.use('/api/user', userRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.info('🚀 Server started', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
});
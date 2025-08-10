import express from "express";
import { generateArticle, generateBlogTitles, generateImage } from "../controllers/aiController.js";
import { auth } from "../middleware/auth.js";

const aiRouter = express.Router();

// 调试中间件
aiRouter.use((req, res, next) => {
    console.log('🔄 AI Router middleware hit:', req.method, req.path);
    next();
});

// 对所有 AI 路由应用认证
aiRouter.use(auth);

// 路由定义
aiRouter.post("/generate-article", generateArticle);
aiRouter.post("/generate-blog-titles", generateBlogTitles);  
aiRouter.post("/generate-image", generateImage);

// 测试路由
aiRouter.get('/test', (req, res) => {
    res.json({ message: 'AI Router is working!' });
});

export default aiRouter;
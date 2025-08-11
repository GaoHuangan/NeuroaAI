import express from "express";
import { generateArticle, generateBlogTitles, generateImage, resumeReview, removeImageObj, removeImageBac } from "../controllers/aiController.js";
import { auth } from "../middleware/auth.js";
import Upload from "../configs/multer.js";

const aiRouter = express.Router();

// 调试中间件
aiRouter.use((req, res, next) => {
    console.log('🔄 AI Router middleware hit:', req.method, req.path);
    next();
});


// 路由定义
aiRouter.post("/generate-article", auth, generateArticle);
aiRouter.post("/generate-blog-titles", auth, generateBlogTitles);
aiRouter.post("/generate-image", auth, generateImage);
aiRouter.post("/remove-object", auth, Upload.single("image"), removeImageObj);
aiRouter.post("/remove-background", auth, Upload.single("image"), removeImageBac);
aiRouter.post("/resume-review", auth, Upload.single("resume"), resumeReview);


// 测试路由
aiRouter.get('/test', (req, res) => {
    res.json({ message: 'AI Router is working!' });
});

export default aiRouter;
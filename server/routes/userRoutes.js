import express from "express";
import {
    getUserCreations,
    getPublishedCreations,
    toggleLikeCreation,
    deleteCreation,
    togglePublishCreation
} from "../controllers/userController.js";
import { auth } from "../middleware/auth.js";

const userRouter = express.Router();

// 调试中间件
userRouter.use((req, res, next) => {
    console.log('🔄 User Router middleware hit:', req.method, req.path);
    next();
});


userRouter.get("/get-user-creations", auth, getUserCreations);
userRouter.get("/get-published-creations", auth, getPublishedCreations);
userRouter.post("/toggle-like-creation", auth, toggleLikeCreation);
userRouter.delete("/delete-creation/:id", auth, deleteCreation);
userRouter.post("/toggle-publish-creation", auth, togglePublishCreation);


// 测试路由
userRouter.get('/test', (req, res) => {
    res.json({ message: 'User Router is working!' });
});

export default userRouter;
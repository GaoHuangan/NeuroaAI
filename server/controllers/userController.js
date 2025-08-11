import sql from "../configs/db.js";
import logger from "../configs/logger.js";

export const getUserCreations = async (req, res) => {
    const startTime = Date.now();

    try {
        const userId = req.userId || req.auth?.userId;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User authentication required"
            });
        }

        logger.info('🔄 getUserCreations', { userId });

        const creations = await sql`
            SELECT 
                id,
                prompt,
                type,
                content,
                created_at,
                publish,
                likes,
                COALESCE(array_length(likes, 1), 0) as like_count
            FROM creations 
            WHERE user_id = ${userId} 
            ORDER BY created_at DESC;
        `;

        // 为每个创作添加额外信息
        const formattedCreations = creations.map(creation => ({
            ...creation,
            isLiked: creation.likes ? creation.likes.includes(userId.toString()) : false,
            visibility: creation.publish ? 'public' : 'private'
        }));

        logger.info('✅ getUserCreations success', { 
            userId, 
            count: creations.length,
            processingTime: Date.now() - startTime
        });

        return res.json({
            success: true,
            data: formattedCreations
        });

    } catch (error) {
        logger.error('❌ getUserCreations error', {
            error: error.message,
            stack: error.stack,
            userId: req.userId,
            processingTime: Date.now() - startTime
        });

        return res.status(500).json({
            success: false,
            message: "Failed to get user creations",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

export const getPublishedCreations = async (req, res) => {
    const startTime = Date.now();

    try {
        const currentUserId = req.userId || req.auth?.userId; // 可能未登录

        logger.info('🔄 getPublishedCreations request');

        // 修复：使用 publish 而不是 published
        const creations = await sql`
            SELECT 
                id,
                user_id,
                prompt,
                type,
                content,
                created_at,
                likes,
                COALESCE(array_length(likes, 1), 0) as like_count
            FROM creations 
            WHERE publish = true 
            ORDER BY created_at DESC;
        `;

        // 为每个创作添加当前用户的点赞状态
        const formattedCreations = creations.map(creation => ({
            ...creation,
            isLiked: currentUserId && creation.likes ? 
                creation.likes.includes(currentUserId.toString()) : false,
            isOwn: currentUserId === creation.user_id
        }));

        logger.info('✅ getPublishedCreations success', { 
            count: creations.length,
            processingTime: Date.now() - startTime
        });

        return res.json({
            success: true,
            data: formattedCreations // 修复：统一使用 data 字段
        });

    } catch (error) {
        logger.error('❌ getPublishedCreations error', {
            error: error.message,
            stack: error.stack,
            processingTime: Date.now() - startTime
        });

        return res.status(500).json({
            success: false,
            message: "Failed to get published creations", // 修复：错误信息更准确
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

export const toggleLikeCreation = async (req, res) => {
    const startTime = Date.now();

    try {
        const userId = req.userId || req.auth?.userId;
        const { creationId } = req.body;

        // 验证输入
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User authentication required"
            });
        }

        if (!creationId) {
            return res.status(400).json({
                success: false,
                message: "Creation ID is required"
            });
        }

        logger.info('🔄 toggleLikeCreation request', { userId, creationId });

        const [creation] = await sql`
            SELECT id, likes FROM creations WHERE id = ${creationId};
        `;

        if (!creation) {
            logger.warn('❌ Creation not found', { creationId, userId });
            return res.status(404).json({
                success: false,
                message: "Creation not found"
            });
        }

        const currentLikes = creation.likes || []; // 处理可能的 null 值
        const userIdStr = userId.toString();
        let updatedLikes;
        let message;
        let isLiked;

        if (currentLikes.includes(userIdStr)) {
            // 取消点赞
            updatedLikes = currentLikes.filter((id) => id !== userIdStr);
            message = "Unliked";
            isLiked = false;
        } else {
            // 添加点赞
            updatedLikes = [...currentLikes, userIdStr];
            message = "Liked";
            isLiked = true;
        }

        // 修复：直接传递数组，不需要格式化
        await sql`
            UPDATE creations 
            SET likes = ${updatedLikes}
            WHERE id = ${creationId};
        `;

        logger.info('✅ toggleLikeCreation success', { 
            userId, 
            creationId, 
            action: message,
            likeCount: updatedLikes.length,
            processingTime: Date.now() - startTime
        });

        return res.json({
            success: true,
            data: {
                message,
                isLiked,
                likeCount: updatedLikes.length,
                likes: updatedLikes
            }
        });

    } catch (error) {
        logger.error('❌ toggleLikeCreation error', {
            error: error.message,
            stack: error.stack,
            userId: req.userId,
            creationId: req.body?.creationId,
            processingTime: Date.now() - startTime
        });

        return res.status(500).json({
            success: false,
            message: "Failed to toggle like", // 修复：错误信息更准确
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// 建议添加的新功能
export const deleteCreation = async (req, res) => {
    const startTime = Date.now();

    try {
        const userId = req.userId || req.auth?.userId;
        const { creationId } = req.params;

        logger.info('🔄 deleteCreation request', { userId, creationId });

        // 验证创作是否属于当前用户
        const [creation] = await sql`
            SELECT id, user_id FROM creations WHERE id = ${creationId};
        `;

        if (!creation) {
            return res.status(404).json({
                success: false,
                message: "Creation not found"
            });
        }

        if (creation.user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: "You can only delete your own creations"
            });
        }

        // 删除创作
        await sql`
            DELETE FROM creations WHERE id = ${creationId};
        `;

        logger.info('✅ deleteCreation success', { 
            userId, 
            creationId,
            processingTime: Date.now() - startTime
        });

        return res.json({
            success: true,
            data: {
                message: "Creation deleted successfully"
            }
        });

    } catch (error) {
        logger.error('❌ deleteCreation error', {
            error: error.message,
            stack: error.stack,
            userId: req.userId,
            creationId: req.params?.creationId,
            processingTime: Date.now() - startTime
        });

        return res.status(500).json({
            success: false,
            message: "Failed to delete creation",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};
import OpenAI from "openai";
import sql from "../configs/db.js";
import { clerkClient } from "@clerk/express";
import logger from '../configs/logger.js';

const AI = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

export const generateArticle = async (req, res) => {
    const startTime = Date.now();
    
    try {
        const userId = req.userId || req.auth?.userId;
        const { prompt, length } = req.body;
        const isPremium = req.isPremium || false;
        const plan = req.plan?.plan || 'Free';
        const freeUsage = req.free_usage?.freeUsage || 0;

        logger.info('📝 Generate article request started', { 
            userId, 
            prompt: prompt?.substring(0, 50) + '...', 
            length,
            isPremium,
            plan,
            freeUsage
        });

        // 验证输入
        if (!prompt || !length) {
            logger.warn('❌ Missing required parameters', { userId, hasPrompt: !!prompt, hasLength: !!length });
            return res.status(400).json({
                success: false,
                message: "Prompt and length are required"
            });
        }

        // 检查免费使用限制
        const maxUsage = parseInt(process.env.MAX_FREE_USAGE) || 10;
        if (!isPremium && freeUsage >= maxUsage) {
            logger.warn('❌ Free usage limit reached', { 
                userId, 
                freeUsage, 
                maxUsage,
                plan 
            });
            return res.status(403).json({
                success: false,
                message: `Free usage limit reached (${freeUsage}/${maxUsage}). Please upgrade to premium.`,
                needsUpgrade: true,
                usage: { current: freeUsage, limit: maxUsage }
            });
        }

        logger.info('✅ Calling AI for article generation', { userId, targetLength: length });

        const response = await AI.chat.completions.create({
            model: "gemini-2.0-flash-exp",
            messages: [{
                role: "user",
                content: `Write an article about: ${prompt}. Target length: approximately ${length} words.`,
            }],
            temperature: 0.7,
            max_tokens: Math.min(parseInt(length) * 2, 4000),
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error('No content received from AI');
        }

        const wordCount = content.split(' ').length;
        logger.info('✅ AI response received', { 
            userId, 
            contentLength: content.length,
            wordCount,
            processingTime: Date.now() - startTime
        });

        // 保存到数据库
        try {
            await sql`
                INSERT INTO creations (user_id, prompt, type, content, created_at)
                VALUES (${userId}, ${prompt}, 'article', ${content}, NOW());
            `;
            logger.info('✅ Article saved to database', { userId });
        } catch (dbError) {
            logger.error('❌ Database save error', { 
                error: dbError.message,
                userId 
            });
        }

        // 更新使用次数（只对非会员用户）
        if (!isPremium) {
            try {
                await clerkClient().users.updateUserMetadata(userId, {
                    privateMetadata: {
                        free_usage: freeUsage + 1
                    }
                });
                logger.info('✅ Updated user usage count', { 
                    userId, 
                    oldUsage: freeUsage, 
                    newUsage: freeUsage + 1 
                });
            } catch (updateError) {
                logger.error('❌ Usage update error', { 
                    error: updateError.message,
                    userId 
                });
            }
        }

        const remaining = isPremium ? 'unlimited' : Math.max(maxUsage - freeUsage - 1, 0);

        logger.info('✅ Article generation completed successfully', { 
            userId,
            wordCount,
            remaining,
            totalTime: Date.now() - startTime
        });

        return res.json({
            success: true,
            data: {
                content,
                wordCount,
                usage: { 
                    plan, 
                    isPremium,
                    remaining,
                    used: isPremium ? 'unlimited' : freeUsage + 1
                }
            }
        });

    } catch (error) {
        logger.error('❌ Generate article error', { 
            error: error.message,
            stack: error.stack,
            userId: req.userId,
            prompt: req.body?.prompt?.substring(0, 50),
            processingTime: Date.now() - startTime
        });
        
        return res.status(500).json({
            success: false,
            message: "Failed to generate article",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

export const generateBlogTitles = async (req, res) => {
    const startTime = Date.now();
    
    try {
        const userId = req.userId || req.auth?.userId;
        const { prompt } = req.body;
        const isPremium = req.isPremium || false;
        const plan = req.plan?.plan || 'Free';
        const freeUsage = req.free_usage?.freeUsage || 0;

        logger.info('📋 Generate blog titles request started', { 
            userId, 
            prompt: prompt?.substring(0, 50) + '...', 
            isPremium,
            plan,
            freeUsage
        });

        if (!prompt) {
            logger.warn('❌ No prompt provided', { userId });
            return res.status(400).json({
                success: false,
                message: "Prompt is required"
            });
        }

        const maxUsage = parseInt(process.env.MAX_FREE_USAGE) || 10;
        if (!isPremium && freeUsage >= maxUsage) {
            logger.warn('❌ Free usage limit reached for blog titles', { 
                userId, 
                freeUsage, 
                maxUsage 
            });
            return res.status(403).json({
                success: false,
                message: "Free usage limit reached. Please upgrade to premium.",
                needsUpgrade: true,
                usage: { current: freeUsage, limit: maxUsage }
            });
        }

        logger.info('✅ Calling AI for blog titles generation', { userId });

        const response = await AI.chat.completions.create({
            model: "gemini-2.0-flash-exp",
            messages: [{
                role: "user",
                content: `Generate 5 engaging blog titles about: ${prompt}`,
            }],
            temperature: 0.7,
            max_tokens: 200,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error('No content received from AI');
        }

        logger.info('✅ AI response received for blog titles', { 
            userId, 
            contentLength: content.length,
            processingTime: Date.now() - startTime
        });

        // 保存到数据库
        try {
            await sql`
                INSERT INTO creations (user_id, prompt, type, content, created_at)
                VALUES (${userId}, ${prompt}, 'blog_titles', ${content}, NOW());
            `;
            logger.info('✅ Blog titles saved to database', { userId });
        } catch (dbError) {
            logger.error('❌ Database save error for blog titles', { 
                error: dbError.message,
                userId 
            });
        }

        // 更新使用次数
        if (!isPremium) {
            try {
                await clerkClient().users.updateUserMetadata(userId, {
                    privateMetadata: {
                        free_usage: freeUsage + 1
                    }
                });
                logger.info('✅ Updated user usage count for blog titles', { 
                    userId, 
                    newUsage: freeUsage + 1 
                });
            } catch (updateError) {
                logger.error('❌ Usage update error for blog titles', { 
                    error: updateError.message,
                    userId 
                });
            }
        }

        const remaining = isPremium ? 'unlimited' : Math.max(maxUsage - freeUsage - 1, 0);

        logger.info('✅ Blog titles generation completed', { 
            userId,
            remaining,
            totalTime: Date.now() - startTime
        });

        return res.json({
            success: true,
            data: {
                content,
                usage: { 
                    plan, 
                    isPremium,
                    remaining,
                    used: isPremium ? 'unlimited' : freeUsage + 1
                }
            }
        });

    } catch (error) {
        logger.error('❌ Generate blog titles error', { 
            error: error.message,
            stack: error.stack,
            userId: req.userId,
            prompt: req.body?.prompt?.substring(0, 50),
            processingTime: Date.now() - startTime
        });
        
        return res.status(500).json({
            success: false,
            message: "Failed to generate blog titles",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

export const generateImage = async (req, res) => {
    const startTime = Date.now();
    
    try {
        const userId = req.userId || req.auth?.userId;
        const { prompt } = req.body;
        const isPremium = req.isPremium || false;
        const plan = req.plan?.plan || 'Free';

        logger.info('🖼️ Generate image request started', { 
            userId, 
            prompt: prompt?.substring(0, 50) + '...', 
            isPremium,
            plan
        });

        if (!prompt) {
            logger.warn('❌ No prompt provided for image generation', { userId });
            return res.status(400).json({
                success: false,
                message: "Prompt is required"
            });
        }

        // 图片生成只允许高级用户
        if (!isPremium) {
            logger.warn('❌ Non-premium user attempted image generation', { 
                userId, 
                plan 
            });
            return res.status(403).json({
                success: false,
                message: "Image generation is only available for premium users.",
                needsUpgrade: true,
                userPlan: plan
            });
        }

        logger.info('✅ Premium user verified, calling AI for image description', { userId });

        const response = await AI.chat.completions.create({
            model: "gemini-2.0-flash-exp",
            messages: [{
                role: "user",
                content: `Create a detailed description for an image about: ${prompt}. Include visual elements, colors, composition, and style.`,
            }],
            temperature: 0.8,
            max_tokens: 300,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error('No content received from AI');
        }

        logger.info('✅ AI response received for image description', { 
            userId, 
            contentLength: content.length,
            processingTime: Date.now() - startTime
        });

        // 保存到数据库
        try {
            await sql`
                INSERT INTO creations (user_id, prompt, type, content, created_at)
                VALUES (${userId}, ${prompt}, 'image_description', ${content}, NOW());
            `;
            logger.info('✅ Image description saved to database', { userId });
        } catch (dbError) {
            logger.error('❌ Database save error for image description', { 
                error: dbError.message,
                userId 
            });
        }

        logger.info('✅ Image generation completed successfully', { 
            userId,
            totalTime: Date.now() - startTime
        });

        return res.json({
            success: true,
            data: {
                content,
                usage: { 
                    plan,
                    isPremium
                }
            }
        });

    } catch (error) {
        logger.error('❌ Generate image error', { 
            error: error.message,
            stack: error.stack,
            userId: req.userId,
            prompt: req.body?.prompt?.substring(0, 50),
            processingTime: Date.now() - startTime
        });
        
        return res.status(500).json({
            success: false,
            message: "Failed to generate image description",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};
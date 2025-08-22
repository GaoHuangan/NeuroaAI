import OpenAI from "openai";
import sql from "../configs/db.js";
import { clerkClient } from "@clerk/express";
import logger from '../configs/logger.js';
import { v2 as cloudinary } from "cloudinary";
import axios from "axios";
import FormData from 'form-data';
import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist';


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const AI = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

export const generateArticle = async (req, res) => {
    const startTime = Date.now();

    try {
        // 添加调试信息
        logger.info('🔍 Generate article called', {
            hasBody: !!req.body,
            bodyType: typeof req.body,
            bodyContent: req.body,
            contentType: req.headers['content-type'],
            method: req.method
        });

        const userId = req.userId || req.auth?.userId;
        
        // 检查 req.body 是否存在
        if (!req.body || typeof req.body !== 'object') {
            logger.error('❌ Invalid request body', {
                userId,
                hasBody: !!req.body,
                bodyType: typeof req.body,
                contentType: req.headers['content-type']
            });
            return res.status(400).json({
                success: false,
                message: "Invalid request body. Expected JSON object.",
                debug: {
                    hasBody: !!req.body,
                    bodyType: typeof req.body,
                    contentType: req.headers['content-type']
                }
            });
        }

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
            logger.warn('❌ Missing required parameters', { 
                userId, 
                hasPrompt: !!prompt, 
                hasLength: !!length,
                promptValue: prompt,
                lengthValue: length
            });
            return res.status(400).json({
                success: false,
                message: "Prompt and length are required",
                received: {
                    prompt: prompt || null,
                    length: length || null
                }
            });
        }

        // 其余代码保持不变...
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
            userId: req.userId || req.auth?.userId,
            prompt: req.body?.prompt?.substring(0, 50),
            processingTime: Date.now() - startTime,
            requestDetails: {
                hasBody: !!req.body,
                bodyType: typeof req.body,
                contentType: req.headers['content-type']
            }
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
        const { prompt, publish } = req.body;
        const isPremium = req.isPremium || false;

        logger.info('🖼️ Generate image request started', {
            userId,
            prompt: prompt?.substring(0, 50) + '...',
            isPremium,
            publish
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
                publish
            });
            return res.status(403).json({
                success: false,
                message: "Image generation is only available for premium users.",
                needsUpgrade: true,
                publish
            });
        }

        logger.info('✅ Premium user verified, calling AI for image description', { userId });

        // 调用 ClipDrop API 生成图片
        const formData = new FormData();
        formData.append('prompt', prompt);

        const response = await axios.post('https://clipdrop-api.co/text-to-image/v1', formData, {
            headers: {
                'X-Api-Key': process.env.CLIPDROP_API_KEY,
                ...formData.getHeaders()
            },
            responseType: 'arraybuffer'
        });

        if (!response.data) {
            throw new Error('No image data received from ClipDrop API');
        }

        logger.info('✅ Image generated successfully from ClipDrop API', {
            userId,
            imageSize: response.data.byteLength
        });
        // 转换为 base64
        const base64Image = `data:image/png;base64,${Buffer.from(response.data, 'binary').toString('base64')}`;

        // 上传到 Cloudinary
        const uploadResult = await cloudinary.uploader.upload(base64Image, {
            folder: 'neuroaAI',
            public_id: `${userId}/image_${Date.now()}`,
            tags: ['neuroaAI', 'image', 'generated']
        });

        if (!uploadResult.secure_url) {
            throw new Error('Failed to upload image to Cloudinary');
        }
        logger.info('✅ Image uploaded to Cloudinary successfully', {
            userId,
            imageUrl: uploadResult.secure_url,
            processingTime: Date.now() - startTime
        });

        // 保存到数据库
        try {
            await sql`
                    INSERT INTO creations (user_id, prompt, type, content, created_at, publish)
                    VALUES (${userId}, ${prompt}, 'image', ${uploadResult.secure_url}, NOW(), ${publish ?? false});
                `;
            logger.info('✅ Image saved to database', { userId, publish: publish ?? false });
        } catch (dbError) {
            logger.error('❌ Database save error for image', {
                error: dbError.message,
                userId
            });
        }

        logger.info('✅ Image generation completed successfully', {
            userId,
            imageUrl: uploadResult.secure_url,
            publish: publish ?? false,
            totalTime: Date.now() - startTime
        });

        return res.json({
            success: true,
            data: {
                content: uploadResult.secure_url,
                imageUrl: uploadResult.secure_url,
                prompt,
                publish: publish ?? false,
                usage: {
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

        // 根据错误类型返回不同的错误信息
        let errorMessage = "Failed to generate image";

        if (error.response?.status === 401) {
            errorMessage = "Invalid ClipDrop API key";
        } else if (error.response?.status === 429) {
            errorMessage = "API rate limit exceeded, please try again later";
        } else if (error.message.includes('Cloudinary')) {
            errorMessage = "Failed to save image";
        }

        return res.status(500).json({
            success: false,
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

export const removeImageBac = async (req, res) => {
    const startTime = Date.now();

    try {
        const userId = req.userId || req.auth?.userId;
        const image = req.file;
        const isPremium = req.isPremium || false;

        logger.info('🖼️ Remove background request started', {
            userId,
            fileName: image?.originalname,
            fileSize: image?.size,
            isPremium,
        });


        if (!image) {
            logger.warn('❌ No image provided for background removal', { userId });
            return res.status(400).json({
                success: false,
                message: "Image file is required"
            });
        }

        // remove background only allow premium user
        if (!isPremium) {
            logger.warn('❌ Non-premium user attempted remove background', {
                userId,
            });
            return res.status(403).json({
                success: false,
                message: "Remove background is only available for premium users.",
                needsUpgrade: true,
            });
        }

        // 检查文件大小
        if (image.size > 10 * 1024 * 1024) {
            logger.warn('❌ File too large', { userId, fileSize: image.size });
            return res.status(400).json({
                success: false,
                message: "File size too large. Maximum 10MB allowed."
            });
        }
        // 只允许高级用户移除背景
        if (!isPremium) {
            logger.warn('❌ Non-premium user attempted background removal', { userId });
            return res.status(403).json({
                success: false,
                message: "Background removal is only available for premium users.",
                needsUpgrade: true,
            });
        }

        logger.info('✅ Premium user verified, processing background removal', {
            userId,
            filePath: image.path
        });
        // 上传到 Cloudinary 并移除背景
        const uploadResult = await cloudinary.uploader.upload(image.path, {
            folder: 'neuroaAI/background-removed',
            public_id: `${userId}/bg_removed_${Date.now()}`,
            tags: ['neuroaAI', 'background-removed'],
            transformation: [
                {
                    effect: 'background_removal'
                }
            ]
        });

        // 清理临时文件
        try {
            fs.unlinkSync(image.path);
            logger.info('✅ Temporary file cleaned up', { filePath: image.path });
        } catch (cleanupError) {
            logger.warn('⚠️ Failed to cleanup temporary file', {
                error: cleanupError.message,
                filePath: image.path
            });
        }

        if (!uploadResult.secure_url) {
            throw new Error('Failed to process background removal');
        }

        logger.info('✅ Background removed successfully', {
            userId,
            originalUrl: uploadResult.secure_url,
            processingTime: Date.now() - startTime
        });

        // 保存到数据库
        try {
            await sql`
                    INSERT INTO creations (user_id, prompt, type, content, created_at)
                    VALUES (${userId}, 'Background removal from uploaded image', 'remove_background', ${uploadResult.secure_url}, NOW());
                `;
            logger.info('✅ Background removal result saved to database', { userId });
        } catch (dbError) {
            logger.error('❌ Database save error for background removal', {
                error: dbError.message,
                userId
            });
        }

        logger.info('✅ Background removal completed successfully', {
            userId,
            resultUrl: uploadResult.secure_url,
            totalTime: Date.now() - startTime
        });

        return res.json({
            success: true,
            data: {
                originalImage: image.originalname,
                processedImage: uploadResult.secure_url,
                imageUrl: uploadResult.secure_url,
                usage: {
                    isPremium
                }
            }
        });

    } catch (error) {
        // 清理可能的临时文件
        if (req.file?.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (cleanupError) {
                logger.warn('Failed to cleanup file after error', {
                    error: cleanupError.message
                });
            }
        }

        logger.error('❌ Background removal error', {
            error: error.message,
            stack: error.stack,
            userId: req.userId,
            processingTime: Date.now() - startTime
        });

        let errorMessage = "Failed to remove background";

        if (error.message.includes('Cloudinary')) {
            errorMessage = "Failed to process image";
        } else if (error.message.includes('file')) {
            errorMessage = "Invalid file format";
        }

        return res.status(500).json({
            success: false,
            content: errorMessage,
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

export const removeImageObj = async (req, res) => {
    const startTime = Date.now();

    try {
        const userId = req.userId || req.auth?.userId;
        const { objectName } = req.body; // 要移除的物体名称
        const image = req.file; // 从 multer 获取文件
        const isPremium = req.isPremium || false;

        logger.info('🖼️ Remove object request started', {
            userId,
            objectName,
            fileName: image?.originalname,
            fileSize: image?.size,
            isPremium,
        });

        // 验证输入
        if (!image) {
            logger.warn('❌ No image file provided', { userId });
            return res.status(400).json({
                success: false,
                message: "Image file is required"
            });
        }

        if (!objectName || objectName.trim() === '') {
            logger.warn('❌ No object name provided', { userId });
            return res.status(400).json({
                success: false,
                message: "Object name is required"
            });
        }

        // 检查文件大小
        if (image.size > 10 * 1024 * 1024) {
            logger.warn('❌ File too large', { userId, fileSize: image.size });
            return res.status(400).json({
                success: false,
                message: "File size too large. Maximum 10MB allowed."
            });
        }

        // 只允许高级用户移除物体
        if (!isPremium) {
            logger.warn('❌ Non-premium user attempted object removal', { userId });
            return res.status(403).json({
                success: false,
                message: "Object removal is only available for premium users.",
                needsUpgrade: true,
            });
        }

        logger.info('✅ Premium user verified, processing object removal', {
            userId,
            objectName,
            filePath: image.path
        });

        // 上传到 Cloudinary 并应用物体移除效果
        const uploadResult = await cloudinary.uploader.upload(image.path, {
            folder: 'neuroaAI/object-removed',
            public_id: `${userId}/object_removed_${Date.now()}`,
            tags: ['neuroaAI', 'object-removed', objectName],
        });

        // 生成带有物体移除效果的 URL
        const processedImageUrl = cloudinary.url(uploadResult.public_id, {
            transformation: [
                {
                    effect: 'generative_remove',
                    prompt: objectName
                }
            ],
            resource_type: 'image'
        });

        // 清理临时文件
        try {
            fs.unlinkSync(image.path);
            logger.info('✅ Temporary file cleaned up', { filePath: image.path });
        } catch (cleanupError) {
            logger.warn('⚠️ Failed to cleanup temporary file', {
                error: cleanupError.message,
                filePath: image.path
            });
        }

        if (!processedImageUrl) {
            throw new Error('Failed to process object removal');
        }

        logger.info('✅ Object removed successfully', {
            userId,
            objectName,
            originalUrl: uploadResult.secure_url,
            processedUrl: processedImageUrl,
            processingTime: Date.now() - startTime
        });

        // 保存到数据库
        try {
            await sql`
                    INSERT INTO creations (user_id, prompt, type, content, created_at)
                    VALUES (${userId}, ${`Removed "${objectName}" from image`}, 'remove_object', ${processedImageUrl}, NOW());
                `;
            logger.info('✅ Object removal result saved to database', { userId });
        } catch (dbError) {
            logger.error('❌ Database save error for object removal', {
                error: dbError.message,
                userId
            });
        }

        logger.info('✅ Object removal completed successfully', {
            userId,
            objectName,
            resultUrl: processedImageUrl,
            totalTime: Date.now() - startTime
        });

        return res.json({
            success: true,
            data: {
                originalImage: uploadResult.secure_url,
                processedImage: processedImageUrl,
                imageUrl: processedImageUrl,
                objectRemoved: objectName,
                usage: {
                    isPremium
                }
            }
        });

    } catch (error) {
        // 清理可能的临时文件
        if (req.file?.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (cleanupError) {
                logger.warn('Failed to cleanup file after error', {
                    error: cleanupError.message
                });
            }
        }

        logger.error('❌ Object removal error', {
            error: error.message,
            stack: error.stack,
            userId: req.userId,
            objectName: req.body?.objectName,
            processingTime: Date.now() - startTime
        });

        let errorMessage = "Failed to remove object from image";

        if (error.message.includes('Cloudinary')) {
            errorMessage = "Failed to process image";
        } else if (error.message.includes('file')) {
            errorMessage = "Invalid file format";
        } else if (error.response?.status === 402) {
            errorMessage = "Cloudinary quota exceeded";
        }

        return res.status(500).json({
            success: false,
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// **ADDED: Configure PDF.js worker**
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const resumeReview = async (req, res) => {
    const startTime = Date.now();

    try {
        const userId = req.userId || req.auth?.userId;
        const resume = req.file;
        const isPremium = req.isPremium || false;

        logger.info('📄 Resume review request started', {
            userId,
            fileName: resume?.originalname,
            fileSize: resume?.size,
            isPremium,
        });

        if (!resume) {
            logger.warn('❌ No resume file provided', { userId });
            return res.status(400).json({
                success: false,
                message: "Resume file is required"
            });
        }

        // Only allow PDF files
        const allowedTypes = ['application/pdf'];
        if (!allowedTypes.includes(resume.mimetype)) {
            logger.warn('❌ Invalid file type', { userId, fileType: resume.mimetype });
            return res.status(400).json({
                success: false,
                message: "Only PDF files are supported. Please upload a PDF resume."
            });
        }

        if (resume.size > 10 * 1024 * 1024) {
            logger.warn('❌ File too large', { userId, fileSize: resume.size });
            return res.status(400).json({
                success: false,
                message: "File size too large. Maximum 10MB allowed."
            });
        }

        if (!isPremium) {
            logger.warn('❌ Non-premium user attempted resume review', { userId });
            return res.status(403).json({
                success: false,
                message: "Resume review is only available for premium users.",
                needsUpgrade: true,
            });
        }

        logger.info('✅ Premium user verified, processing resume review', {
            userId,
            fileName: resume.originalname,
            filePath: resume.path
        });

        // **MODIFIED: Read PDF file using pdfjs-dist**
        let resumeText = '';
        try {
            const dataBuffer = fs.readFileSync(resume.path);
            const uint8Array = new Uint8Array(dataBuffer);
            
            // **ADDED: Load PDF document using pdfjs-dist**
            const pdfDocument = await pdfjsLib.getDocument({ data: uint8Array }).promise;
            
            // **ADDED: Extract text from each page**
            const maxPages = Math.min(pdfDocument.numPages, 5); // Limit to first 5 pages
            
            for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
                try {
                    const page = await pdfDocument.getPage(pageNum);
                    const textContent = await page.getTextContent();
                    
                    const pageText = textContent.items
                        .map(item => item.str)
                        .join(' ');
                    
                    resumeText += pageText + '\n';
                    
                } catch (pageError) {
                    logger.warn(`Failed to extract text from page ${pageNum}`, { 
                        error: pageError.message 
                    });
                }
            }
            
            resumeText = resumeText.trim();
            // **WHY: pdfjs-dist is more stable and reliable than pdf-parse**

            logger.info('✅ PDF resume content extracted', {
                userId,
                textLength: resumeText.length,
                pages: pdfDocument.numPages
            });

        } catch (parseError) {
            logger.error('❌ Failed to parse PDF resume file', {
                error: parseError.message,
                userId,
                fileName: resume.originalname
            });
            throw new Error('Failed to read PDF content. Please ensure the PDF is not password protected or corrupted.');
        }

        // Clean up temporary file
        try {
            fs.unlinkSync(resume.path);
            logger.info('✅ Temporary file cleaned up', { filePath: resume.path });
        } catch (cleanupError) {
            logger.warn('⚠️ Failed to cleanup temporary file', {
                error: cleanupError.message,
                filePath: resume.path
            });
        }

        if (!resumeText || resumeText.trim().length < 50) {
            throw new Error('Resume content is too short or could not be extracted properly. Please ensure your PDF contains readable text.');
        }

        // Clean the extracted text
        resumeText = resumeText.replace(/\s+/g, ' ').trim();

        // Enhanced AI prompt for better structured response
        const prompt = `Please provide a comprehensive review of the following resume. 
            Analyze it for:
            1. Overall structure and formatting
            2. Content quality and relevance
            3. Skills and experience presentation
            4. Areas for improvement
            5. Specific recommendations
            6. Overall score (0-100)
            
            Resume content:
            ${resumeText}
            
            Please provide your response in the following JSON format:
            {
                "summary": "Brief overall assessment",
                "strengths": ["strength1", "strength2", "strength3"],
                "improvements": ["improvement1", "improvement2", "improvement3"],
                "score": 85,
                "detailed_feedback": "Detailed analysis and recommendations"
            }`;

        const response = await AI.chat.completions.create({
            model: "gemini-2.0-flash-exp",
            messages: [{
                role: "user",
                content: prompt,
            }],
            temperature: 0.7,
            max_tokens: 3000,
        });

        const content = response.choices[0]?.message?.content;

        if (!content) {
            throw new Error('No review content received from AI');
        }

        // Try to parse JSON response
        let parsedContent;
        try {
            parsedContent = JSON.parse(content);
        } catch (jsonError) {
            // Fallback for non-JSON response
            parsedContent = {
                summary: "AI analysis completed",
                detailed_feedback: content,
                score: null
            };
        }

        logger.info('✅ AI review generated successfully', {
            userId,
            reviewLength: content.length,
            processingTime: Date.now() - startTime
        });

        // Save to database
        try {
            await sql`
                INSERT INTO creations (user_id, prompt, type, content, created_at)
                VALUES (${userId}, ${`Resume review for ${resume.originalname}`}, 'resume_review', ${content}, NOW());
            `;
            logger.info('✅ Resume review result saved to database', { userId });
        } catch (dbError) {
            logger.error('❌ Database save error for resume review', {
                error: dbError.message,
                userId
            });
        }

        logger.info('✅ Resume review completed successfully', {
            userId,
            fileName: resume.originalname,
            totalTime: Date.now() - startTime
        });

        return res.json({
            success: true,
            data: {
                fileName: resume.originalname,
                fileSize: resume.size,
                fileType: resume.mimetype,
                analysis: parsedContent,
                wordCount: resumeText.split(' ').length,
                supportedFormats: ['application/pdf'],
                usage: {
                    isPremium
                }
            }
        });

    } catch (error) {
        // Clean up possible temporary files
        if (req.file?.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (cleanupError) {
                logger.warn('Failed to cleanup file after error', {
                    error: cleanupError.message
                });
            }
        }

        logger.error('❌ Resume review error', {
            error: error.message,
            stack: error.stack,
            userId: req.userId,
            fileName: req.file?.originalname,
            processingTime: Date.now() - startTime
        });

        let errorMessage = "Failed to review resume";

        if (error.message.includes('read') || error.message.includes('PDF')) {
            errorMessage = "Failed to read PDF file. Please ensure it's not password protected.";
        } else if (error.message.includes('content')) {
            errorMessage = "Resume content could not be extracted properly.";
        } else if (error.message.includes('AI') || error.message.includes('API')) {
            errorMessage = "AI service temporarily unavailable.";
        } else if (error.message.includes('password')) {
            errorMessage = "Cannot read password-protected PDF files.";
        }

        return res.status(500).json({
            success: false,
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};
import { clerkClient, getAuth } from "@clerk/express";
import jwt from 'jsonwebtoken';
import logger from '../configs/logger.js';

export const auth = async (req, res, next) => {
    try {
        logger.info('🔐 Auth middleware started', { 
            path: req.path, 
            method: req.method,
            userAgent: req.headers['user-agent']
        });
        
        const authHeader = req.headers.authorization;
        if (authHeader) {
            let token = authHeader;
            while (token.startsWith('Bearer ')) {
                token = token.substring(7);
            }
            
            const decoded = jwt.decode(token);
            if (decoded) {
                logger.info('✅ Token decoded successfully', { 
                    issuer: decoded.iss,
                    subject: decoded.sub,
                    tokenLength: token.length
                });
                
                const tokenExpired = decoded.exp < Math.floor(Date.now() / 1000);
                logger.info('Token validation', { 
                    expired: tokenExpired,
                    expiresAt: new Date(decoded.exp * 1000),
                    currentTime: new Date()
                });
                
                if (!tokenExpired || (tokenExpired && decoded.exp > (Math.floor(Date.now() / 1000) - 3600))) {
                    const userPlan = decoded.pla;
                    const isPremium = userPlan && userPlan.includes('u:premium');
                    
                    req.plan = { plan: isPremium ? 'Premium' : 'Free' };
                    req.free_usage = { freeUsage: 0 };
                    req.userId = decoded.sub;
                    req.auth = { userId: decoded.sub };
                    req.isPremium = isPremium;
                    
                    logger.info('🎫 Using token data', { 
                        userId: decoded.sub,
                        plan: req.plan.plan,
                        isPremium
                    });
                    
                    return next();
                }
            }
        }
        
        const authData = getAuth(req);
        const { userId } = authData;
        
        if (!userId) {
            logger.warn('⚠️ No userId found, using test data');
            req.plan = { plan: 'Free' };
            req.free_usage = { freeUsage: 5 };
            req.userId = 'test-user-id';
            req.auth = { userId: 'test-user-id' };
            req.isPremium = false;
            return next();
        }

        // 正常认证流程
        let user = null;
        try {
            user = await clerkClient().users.getUser(userId);
            logger.info('✅ User data retrieved from Clerk', { userId });
        } catch (clientError) {
            logger.error('❌ clerkClient failed', { 
                error: clientError.message,
                userId 
            });
            user = { privateMetadata: { plan: 'Free', free_usage: 5 } };
        }

        const userPlan = user.privateMetadata?.plan || 'Free';
        const isPremium = userPlan.toLowerCase() === 'premium';
        const freeUsage = user.privateMetadata?.free_usage || 0;

        req.plan = { plan: userPlan };
        req.free_usage = { freeUsage };
        req.userId = userId;
        req.auth = authData;
        req.isPremium = isPremium;
        
        logger.info('✅ Auth completed', { 
            userId,
            plan: userPlan,
            isPremium,
            freeUsage
        });
        
        next();

    } catch (error) {
        logger.error('❌ Auth middleware error', { 
            error: error.message,
            stack: error.stack,
            path: req.path
        });
        
        req.plan = { plan: 'Free' };
        req.free_usage = { freeUsage: 5 };
        req.userId = 'test-user-id';
        req.auth = { userId: 'test-user-id' };
        req.isPremium = false;
        
        next();
    }
};
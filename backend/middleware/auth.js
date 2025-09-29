const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid token.' });
        }
        
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token.' });
    }
};

const optionalAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findByPk(decoded.id);
            if (user) {
                req.user = user;
            }
        }
        
        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};

const rateLimiter = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    const requests = new Map();
    
    return (req, res, next) => {
        const ip = req.ip;
        const now = Date.now();
        
        if (!requests.has(ip)) {
            requests.set(ip, { count: 1, resetTime: now + windowMs });
            return next();
        }
        
        const requestData = requests.get(ip);
        
        if (now > requestData.resetTime) {
            requests.set(ip, { count: 1, resetTime: now + windowMs });
            return next();
        }
        
        if (requestData.count >= maxRequests) {
            return res.status(429).json({ 
                error: 'Too many requests',
                retryAfter: Math.ceil((requestData.resetTime - now) / 1000)
            });
        }
        
        requestData.count++;
        next();
    };
};

module.exports = { authenticate, optionalAuth, rateLimiter };

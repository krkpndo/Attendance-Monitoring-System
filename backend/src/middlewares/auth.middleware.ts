import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { verifyAccessToken } from '../utils/token_utils';

dotenv.config();

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
  
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided",
      });
    }
  
    const token = authHeader.split(" ")[1] as string;

    try {
      const decodedToken = verifyAccessToken(token);
      req.user = decodedToken;
      
      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Token',
        code: 'INVALID_TOKEN'
      });
    }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    next();
  };
};
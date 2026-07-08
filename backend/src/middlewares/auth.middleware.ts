import { Request, Response, NextFunction } from 'express';
import { hashToken, verifyAccessToken } from '../utils/token_utils';
import { UserType } from '@prisma/client';
import prisma from '../config/prisma';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
  
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided",
        code: 'NO_TOKEN'
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

export const authorize = (...roles: UserType[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
        code: 'FORBIDDEN'
      });
    }

    next();
  };
};

export const authenticateDevice = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Device ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No device token provided',
      code: 'NO_DEVICE_TOKEN'
    });
  }

  const token = authHeader.split(' ')[1] as string;

  try {
    const device = await prisma.device.findUnique({
      where: { tokenHash: hashToken(token) },
      select: { id: true, label: true, status: true }
    });

    if (!device || device.status !== 'ACTIVE') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or revoked device token',
        code: 'INVALID_DEVICE_TOKEN'
      });
    }

    await prisma.device.update({
      where: { id: device.id },
      data: { lastSeenAt: new Date() }
    });

    req.device = device;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid device token',
      code: 'INVALID_DEVICE_TOKEN'
    });
  }
};
import { Request } from "express";
import { TokenPayload } from "./token.interface";
import { UserStatus, UserType } from "@prisma/client";

export interface AuthRequest extends Request {
    user: TokenPayload;
}

export interface LoginParam {
    identifier: string;
    password: string;
}

export interface LoginResponse {
    tokens: {
        accessToken: string;
        refreshToken: string;
    },
    user: {
        id: string;
        type: UserType;
        status: UserStatus;
        lastLoginAt: Date | null;
    }
}
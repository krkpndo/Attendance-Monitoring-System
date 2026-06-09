import { Request } from "express";
import { TokenPayload } from "./token.inteface";

export interface AuthRequest extends Request {
    user: TokenPayload
}

export interface LoginParam {
    identifier: string,
    password: string
}

export interface LoginResponse {
    tokens: {
        accessToken: string,
        refreshToken: string
    },
    user: {
        id: string,
        type: string,
        status: string
    }
}
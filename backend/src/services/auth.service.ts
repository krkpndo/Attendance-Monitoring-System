import argon2 from 'argon2';
import prisma from '../config/prisma';
import { generateTokenPair } from '../utils/token_utils';
import { AppError } from '../utils/app-error';
import { LoginParam, LoginResponse } from '../interfaces/auth.interface';

class AuthService {

    static async login(param: LoginParam): Promise<LoginResponse> {
        const student = await prisma.student.findUnique({
            where: { studentNumber: param.identifier },
            include: { user: true }
        });
    
        if (student) {
            const validPassword = await argon2.verify(student.user.password, param.password);
    
            if (!validPassword) {
                throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
            }
    
            if (student.user.status === 'INACTIVE') {
                throw new AppError('Account is currently deactivated', 403, 'ACCOUNT_DEACTIVATED');
            }
    
            const tokens = generateTokenPair(student.user.id, student.user.type);

            const { id, type, status } = student.user;
    
            return {
                tokens,
                user: {
                    id,
                    type,
                    status,
                }
            };
        }
    
        const professor = await prisma.professor.findUnique({
            where: { employeeNumber: param.identifier },
            include: { user: true }
        });
    
        if (professor) {
            const validPassword = await argon2.verify(professor.user.password, param.password);
    
            if (!validPassword) {
                throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
            }
    
            if (professor.user.status === 'INACTIVE') {
                throw new AppError('Account is currently deactivated', 403, 'ACCOUNT_DEACTIVATED');
            }
    
            const tokens = generateTokenPair(professor.user.id, professor.user.type);

            const { id, type, status } = professor.user;
    
            return {
                tokens,
                user: {
                    id,
                    type,
                    status,
                },
            };
        }
    
        const user = await prisma.user.findUnique({
            where: { username: param.identifier }
        });
    
        if (user && user.type === 'ADMIN') {
            const validPassword = await argon2.verify(user.password, param.password);
    
            if (!validPassword) {
                throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
            }
    
            if (user.status === 'INACTIVE') {
                throw new AppError('Account is currently deactivated', 403, 'ACCOUNT_DEACTIVATED');
            }
    
            const tokens = generateTokenPair(user.id, user.type);

            const { id, type, status } = user;
    
            return {
                tokens,
                user: {
                    id,
                    type,
                    status,
                }
            };
        }
    
        throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    static async getMe(userId: string): Promise<LoginResponse['user']> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, type: true, status: true }
        });

        if (!user) {
            throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }

        return user;
    }
}

export default AuthService;
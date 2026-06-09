import prisma from "../config/prisma";
import { AppError } from "../utils/app-error";

class NotificationService {
    static async getNotifications(userId: string) {
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        return notifications;
    }

    static async markAsRead(userId: string, notificationId: string) {
        const notification = await prisma.notification.findFirst({
            where: { id: notificationId, userId }
        });

        if (!notification) {
            throw new AppError('Notification not found', 404, 'NOT_FOUND');
        }

        const updated = await prisma.notification.update({
            where: { id: notificationId },
            data: {
                isRead: true,
                readAt: new Date()
            }
        });

        return updated;
    }

    static async createNotification(
        data: {
            userId: string;
            type: string;
            title: string;
            message: string;
            metadata?: any;
        }
    ) {
        const notification = await prisma.notification.create({
            data: {
                userId: data.userId,
                type: data.type as any,
                title: data.title,
                message: data.message,
                metadata: data.metadata
            }
        });

        return notification;
    }

    static async getUnreadCount(userId: string) {
        const count = await prisma.notification.count({
            where: { userId, isRead: false }
        });

        return count;
    }
}

export default NotificationService;
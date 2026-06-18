import prisma from "../config/prisma";
import { CreateNotificationInput } from "../interfaces/notification.interface";
import { AppError } from "../utils/app_error";

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

    static async createNotification(data: CreateNotificationInput) {

        return prisma.notification.create({
            data: {
                userId: data.userId,
                type: data.type,
                title: data.title,
                message: data.message,
                metadata: data.metadata
            }
        });
    }

    static async safeCreate(data: CreateNotificationInput) {
        try {
            await this.createNotification(data);
        } catch (error) {
            console.error('[NotificationService] failed to deliver notification', error);
        }
    }

    static async getUnreadCount(userId: string) {
        const count = await prisma.notification.count({
            where: { userId, isRead: false }
        });

        return count;
    }

    static async safeCreateMany(data: CreateNotificationInput[]) {
        if (data.length === 0) return;

        try {
            await prisma.notification.createMany({
                data: data.map((d) => ({
                    userId: d.userId,
                    type: d.type,
                    title: d.title,
                    message: d.message,
                    metadata: d.metadata
                }))
            });
        } catch (error) {
            console.error('[NotificationService] failed to deliver batch notifications', error);
        }
    }
}

export default NotificationService;
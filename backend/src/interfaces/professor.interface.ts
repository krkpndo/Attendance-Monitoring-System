import { AttendanceStatus, ExcuseStatus, UserStatus } from "@prisma/client";

export interface UpdateProfileDto {
    name?: string; 
    email?: string; 
    username?: string;
    password?: string;
    newPassword?: string;
    profileImage?: string;
    status?: UserStatus
}

export interface MarkAttendanceDto {
    userId: string,
    recordId: string,
    data: {
        status: AttendanceStatus;
        remarks?: string
    }
}

export interface ReviewExcuseLetterDto {
    userId: string;
    excuseId: string;
    data: {
        status: Extract<ExcuseStatus, 'APPROVED' | 'REJECTED'>,
        rejectionReason?: string;
    }
}
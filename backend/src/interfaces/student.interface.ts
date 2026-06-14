import { ExcuseType } from "@prisma/client";


export interface StudentProfileDto {
    name?: string;
    email?: string;
    profileImage?: string;
}

export interface StudentUpdateProfileDto {
    name?: string;
    email?: string;
    username?: string;
    password: string;
    profileImage?: string; 
}

export interface SubmitExcuseLetterDto {
    excuseType: ExcuseType;
    description: string;
    attendanceRecordIds: string[]
}

export interface StudentAttendanceDto {
    userId: string;
    classId: string;
    startDate?: Date;
    endDate?: Date;
}

export interface StudentAbsencesDto {
    studentId: string;
    startDate: Date;
    endDate: Date;
}

export interface UploadExcuseLetterAttachmentsDto {
    userId: string,
    excuseId: string,
    files: {
        fileName: string;
        fileType: string;
        fileSize: number;
        filePath: string
    }[]
}
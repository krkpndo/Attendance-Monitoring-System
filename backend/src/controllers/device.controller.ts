import { Request, Response, NextFunction } from "express";
import AttendanceEngine from "../services/attendance.service";


export const tap = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { rfidNumber } = req.body;

        const result = await AttendanceEngine.resolveTap({
            deviceId: req.device!.id,
            rfidNumber
        });

        return res.status(200).json({
            success: true,
            message: `${result.studentName}: ${result.status}`,
            data: result
        });
        
    } catch (error) {
        next(error);
    }
};
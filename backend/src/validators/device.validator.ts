import z from "zod";

export const tapSchema = z.object({
    rfidNumber: z.string().min(1, 'RFID number is required')
});
import { DeviceStatus } from "@prisma/client";
import { TokenPayload } from "../interfaces/token.interface";

declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
            device?: { id: string; label: string; status: DeviceStatus }
            
        }
    }
}
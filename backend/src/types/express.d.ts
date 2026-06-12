import { TokenPayload } from "../interfaces/token.interface";

declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload
        }
    }
}
import { TokenPayload } from "../interfaces/token.inteface";

declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload
        }
    }
}
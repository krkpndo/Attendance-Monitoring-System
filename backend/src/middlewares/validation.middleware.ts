import { Request, Response, NextFunction } from "express";
import  { ZodError, ZodType } from "zod";

export const validate = (schema: ZodType, source: 'body' | 'query' | 'params' = 'body') => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const parsed = schema.parse(req[source]);
            if (source === 'body') {
                req.body = parsed;
            }
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const messages = error.issues.map(e => ({
                    field: e.path.join('.'),
                    message: e.message
                }));

                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: messages
                });
                return;
            }
            next(error);
        }
    };
};
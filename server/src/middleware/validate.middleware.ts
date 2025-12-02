import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        // console.log(`🔍 [VALIDATE] Validating ${req.method} ${req.url}`);
        await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params
        });
        return next();
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                error: 'Error de validación',
                details: (error as any).errors.map((e: any) => ({
                    field: e.path.join('.'),
                    message: e.message
                }))
            });
        }
        return res.status(500).json({ error: 'Error interno de validación' });
    }
};

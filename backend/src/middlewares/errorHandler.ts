import { Request, Response, NextFunction } from 'express';

/**
 * Custom API Error class with status code
 * Spring'deki ResponseStatusException'a benzer
 */
export class ApiError extends Error {
    status: number;
    isOperational: boolean;

    constructor(message: string, status: number = 500, isOperational: boolean = true) {
        super(message);
        this.status = status;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(message: string = 'Geçersiz istek') {
        return new ApiError(message, 400);
    }

    static unauthorized(message: string = 'Yetkilendirme gerekli') {
        return new ApiError(message, 401);
    }

    static forbidden(message: string = 'Bu işlem için yetkiniz yok') {
        return new ApiError(message, 403);
    }

    static notFound(message: string = 'Kaynak bulunamadı') {
        return new ApiError(message, 404);
    }

    static conflict(message: string = 'Kayıt zaten mevcut') {
        return new ApiError(message, 409);
    }

    static tooManyRequests(message: string = 'Çok fazla istek') {
        return new ApiError(message, 429);
    }

    static internal(message: string = 'Sunucu hatası') {
        return new ApiError(message, 500, false);
    }
}

/**
 * Express async handler wrapper
 * Her controller'da try-catch yazmayı önler
 * Spring'deki @ExceptionHandler gibi çalışır
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Global error handler middleware
 * Tüm hataları yakalar ve tutarlı response döner
 */
export const errorHandler = (
    err: Error | ApiError,
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    // Default values
    let status = 500;
    let message = 'Sunucu hatası oluştu';
    let isOperational = false;

    // ApiError ise bilgileri al
    if (err instanceof ApiError) {
        status = err.status;
        message = err.message;
        isOperational = err.isOperational;
    } else if (err.message) {
        message = err.message;
    }

    // Development'ta stack trace logla
    if (process.env.NODE_ENV !== 'production') {
        console.error(`[${status}] ${message}`);
        if (!isOperational) {
            console.error(err.stack);
        }
    }

    // Response
    res.status(status).json({
        error: message,
        ...(process.env.NODE_ENV !== 'production' && !isOperational && { stack: err.stack })
    });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
    next(new ApiError(`Endpoint bulunamadı: ${req.method} ${req.path}`, 404));
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = exports.asyncHandler = exports.ApiError = void 0;
/**
 * Custom API Error class with status code
 * Spring'deki ResponseStatusException'a benzer
 */
class ApiError extends Error {
    constructor(message, status = 500, isOperational = true) {
        super(message);
        this.status = status;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
    static badRequest(message = 'Geçersiz istek') {
        return new ApiError(message, 400);
    }
    static unauthorized(message = 'Yetkilendirme gerekli') {
        return new ApiError(message, 401);
    }
    static forbidden(message = 'Bu işlem için yetkiniz yok') {
        return new ApiError(message, 403);
    }
    static notFound(message = 'Kaynak bulunamadı') {
        return new ApiError(message, 404);
    }
    static conflict(message = 'Kayıt zaten mevcut') {
        return new ApiError(message, 409);
    }
    static tooManyRequests(message = 'Çok fazla istek') {
        return new ApiError(message, 429);
    }
    static internal(message = 'Sunucu hatası') {
        return new ApiError(message, 500, false);
    }
}
exports.ApiError = ApiError;
/**
 * Express async handler wrapper
 * Her controller'da try-catch yazmayı önler
 * Spring'deki @ExceptionHandler gibi çalışır
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
/**
 * Global error handler middleware
 * Tüm hataları yakalar ve tutarlı response döner
 */
const errorHandler = (err, req, res, _next) => {
    // Default values
    let status = 500;
    let message = 'Sunucu hatası oluştu';
    let isOperational = false;
    // ApiError ise bilgileri al
    if (err instanceof ApiError) {
        status = err.status;
        message = err.message;
        isOperational = err.isOperational;
    }
    else if (err.message) {
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
exports.errorHandler = errorHandler;
/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res, next) => {
    next(new ApiError(`Endpoint bulunamadı: ${req.method} ${req.path}`, 404));
};
exports.notFoundHandler = notFoundHandler;

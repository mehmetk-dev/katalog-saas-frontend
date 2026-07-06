"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundLimiter = exports.heavyMutationLimiter = exports.expensiveReadLimiter = exports.publicPdfLimiter = exports.publicCatalogLimiter = exports.authLimiter = exports.apiLimiter = exports.suspiciousProbeLimiter = void 0;
const express_rate_limit_1 = __importStar(require("express-rate-limit"));
const isDev = process.env.NODE_ENV !== 'production';
const getSingleHeader = (value) => {
    if (Array.isArray(value))
        return value[0];
    return value;
};
const getClientIpKey = (req) => {
    const cloudflareIp = getSingleHeader(req.headers['cf-connecting-ip']);
    const ip = cloudflareIp || req.ip || req.socket.remoteAddress;
    return ip ? `ip:${(0, express_rate_limit_1.ipKeyGenerator)(ip)}` : 'ip:unknown';
};
const getUserOrIpKey = (req) => {
    const authUser = req.user;
    return authUser?.id ? `user:${authUser.id}` : getClientIpKey(req);
};
const suspiciousProbePattern = /(?:^|\/)(?:\.env|\.git|wp-admin|wp-content|wp-includes|wordpress|xmlrpc\.php|phpinfo\.php|info\.php|vendor|phpunit|cgi-bin|server-status|actuator|secrets\.json|terraform\.tfvars)|\.php(?:$|\?)/i;
exports.suspiciousProbeLimiter = (0, express_rate_limit_1.default)({
    windowMs: 10 * 60 * 1000,
    max: isDev ? 1000 : 20,
    keyGenerator: getClientIpKey,
    skip: (req) => !suspiciousProbePattern.test(req.path),
    message: { error: 'Too many invalid requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 10000 : 1000,
    keyGenerator: getClientIpKey,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 100 : 10,
    keyGenerator: getClientIpKey,
    message: { error: 'Too many login attempts, please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
});
exports.publicCatalogLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: isDev ? 1000 : 60,
    keyGenerator: getClientIpKey,
    message: { error: 'Too many catalog requests, please try again shortly.' },
    standardHeaders: true,
    legacyHeaders: false,
});
exports.publicPdfLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: isDev ? 1000 : 30,
    keyGenerator: getClientIpKey,
    message: { error: 'Too many PDF requests, please try again shortly.' },
    standardHeaders: true,
    legacyHeaders: false,
});
exports.expensiveReadLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: isDev ? 1000 : 120,
    keyGenerator: getUserOrIpKey,
    message: { error: 'Too many data requests, please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
});
exports.heavyMutationLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 500 : 30,
    keyGenerator: getUserOrIpKey,
    message: { error: 'Too many heavy operations, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
exports.notFoundLimiter = (0, express_rate_limit_1.default)({
    windowMs: 10 * 60 * 1000,
    max: isDev ? 1000 : 80,
    keyGenerator: getClientIpKey,
    message: { error: 'Too many missing resources requested, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

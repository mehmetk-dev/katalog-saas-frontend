import type { Request } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

import type { AuthUser } from './auth';

type RequestWithUser = Request & { user?: AuthUser };

const isDev = process.env.NODE_ENV !== 'production';

const getSingleHeader = (value: string | string[] | undefined) => {
    if (Array.isArray(value)) return value[0];
    return value;
};

const getClientIpKey = (req: Request) => {
    const cloudflareIp = getSingleHeader(req.headers['cf-connecting-ip']);
    const ip = cloudflareIp || req.ip || req.socket.remoteAddress;

    return ip ? `ip:${ipKeyGenerator(ip)}` : 'ip:unknown';
};

const getUserOrIpKey = (req: Request) => {
    const authUser = (req as RequestWithUser).user;
    return authUser?.id ? `user:${authUser.id}` : getClientIpKey(req);
};

const suspiciousProbePattern =
    /(?:^|\/)(?:\.env|\.git|wp-admin|wp-content|wp-includes|wordpress|xmlrpc\.php|phpinfo\.php|info\.php|vendor|phpunit|cgi-bin|server-status|actuator|secrets\.json|terraform\.tfvars)|\.php(?:$|\?)/i;

export const suspiciousProbeLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: isDev ? 1000 : 20,
    keyGenerator: getClientIpKey,
    skip: (req) => !suspiciousProbePattern.test(req.path),
    message: { error: 'Too many invalid requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 10000 : 1000,
    keyGenerator: getClientIpKey,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 100 : 10,
    keyGenerator: getClientIpKey,
    message: { error: 'Too many login attempts, please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
});

export const publicCatalogLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: isDev ? 1000 : 60,
    keyGenerator: getClientIpKey,
    message: { error: 'Too many catalog requests, please try again shortly.' },
    standardHeaders: true,
    legacyHeaders: false,
});

export const publicPdfLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: isDev ? 1000 : 30,
    keyGenerator: getClientIpKey,
    message: { error: 'Too many PDF requests, please try again shortly.' },
    standardHeaders: true,
    legacyHeaders: false,
});

export const expensiveReadLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: isDev ? 1000 : 120,
    keyGenerator: getUserOrIpKey,
    message: { error: 'Too many data requests, please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
});

export const heavyMutationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 500 : 30,
    keyGenerator: getUserOrIpKey,
    message: { error: 'Too many heavy operations, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

export const notFoundLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: isDev ? 1000 : 80,
    keyGenerator: getClientIpKey,
    message: { error: 'Too many missing resources requested, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});



import * as Sentry from "@sentry/nextjs";
import { sentryBeforeSend } from "@/lib/sentry/before-send";

Sentry.init({
    // Hardcoded DSN to match server/edge and ensure it works even if env vars are missing
    dsn: "https://868079ea0eaa70b831e1783792021d35@o4510766025080832.ingest.de.sentry.io/4510766042710096",

    // Only send errors in production — keeps dev console clean and saves Sentry quota
    enabled: process.env.NODE_ENV === "production",

    // Debug logs only in dev (moot since disabled, but kept for when re-enabling)
    debug: false,

    // Performance Monitoring
    tracesSampleRate: 1.0,

    // Session Replay
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,

    // Browser Profiling
    profilesSampleRate: 0.1,

    // INTEGRATIONS
    integrations: [
        Sentry.replayIntegration(),
        Sentry.browserTracingIntegration(),
        // Capture network errors (including CORS issues)
        Sentry.httpClientIntegration({
            failedRequestStatusCodes: [[400, 599]],
            failedRequestTargets: [/.*/], // Monitor all requests
        }),
    ],

    // FORCE capturing extension/content.js errors 
    // Usually Sentry ignores these to reduce noise, but the user specifically asked for them
    ignoreErrors: [], // Clear default ignore list
    denyUrls: [],     // Clear default deny list
    allowUrls: [
        /https?:\/\/fogcatalog\.com/,
        /https?:\/\/localhost/,
        /.*content\.js.*/, // Allow chrome extension errors like the ones from content.js
    ],

    // Capture unhandled rejections and add more context
    attachStacktrace: true,
    sendDefaultPii: true,

    // CIRCUMVENT ad-blockers (if configured in next.config.mjs)
    tunnel: "/monitoring",

    // Beklenen iş-mantığı hatalarını filtrele (server action'dan yansıyan
    // "Limit Reached" vb. client tarafında da yakalanıyor).
    beforeSend: sentryBeforeSend,
});



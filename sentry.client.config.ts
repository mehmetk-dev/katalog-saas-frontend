console.log("Sentry Client Config loading...");

import * as Sentry from "@sentry/nextjs";

Sentry.init({
    // Hardcoded DSN to match server/edge and ensure it works even if env vars are missing
    dsn: "https://868079ea0eaa70b831e1783792021d35@o4510766025080832.ingest.de.sentry.io/4510766042710096",

    // Enable for all environments temporarily to verify it's working
    enabled: true,

    // Set to true to see Sentry debug logs in browser console
    debug: true,

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
});

// Manual tests to verify Sentry is working
console.info("Sentry initialization complete. Sending test events...");
Sentry.captureMessage("Sentry Test: Initialization success");
Sentry.captureException(new Error("Sentry Test: CaptureException test"));

// Add a helper to the window for manual testing in console
if (typeof window !== "undefined") {
    (window as any).testSentry = () => {
        console.log("Triggering manual Sentry error...");
        Sentry.captureException(new Error("Manual test error from browser console"));
        alert("Sentry test error sent! Check your dashboard.");
    };
}

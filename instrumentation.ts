import * as Sentry from "@sentry/nextjs";

export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        await import("./sentry.server.config");
    }

    if (process.env.NEXT_RUNTIME === "edge") {
        await import("./sentry.edge.config");
    }
}

// Server Component render hatalarını Sentry'ye gönder
// Bu hook OLMADAN, production build'de sunucu hataları sadece kullanıcıya
// genel bir mesaj gösterir ama Sentry'ye BİLDİRİLMEZ.
export const onRequestError = Sentry.captureRequestError;

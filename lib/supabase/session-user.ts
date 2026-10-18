import type { AuthError, JwtPayload, SupabaseClient, User } from "@supabase/supabase-js"

type ClaimsClient = { auth: Pick<SupabaseClient["auth"], "getClaims"> }

/** Token'dan çıkan, doğrulanmış kullanıcı bilgisi */
export interface SessionUser {
    id: string
    email?: string
    user_metadata: Record<string, unknown>
    app_metadata: Record<string, unknown>
    /** Son giriş zamanı (token'daki amr kaydından); bilinmiyorsa undefined */
    last_sign_in_at?: string
}

export function claimsToSessionUser(claims: JwtPayload): SessionUser {
    const signInTimes = (claims.amr ?? [])
        .map((entry) => entry.timestamp)
        .filter((value): value is number => typeof value === "number")
    return {
        id: claims.sub,
        email: claims.email,
        user_metadata: claims.user_metadata ?? {},
        app_metadata: claims.app_metadata ?? {},
        last_sign_in_at: signInTimes.length > 0 ? new Date(Math.max(...signInTimes) * 1000).toISOString() : undefined,
    }
}

/**
 * Oturumdaki kullanıcıyı doğrular. getUser() her çağrıda Supabase Auth'a (us-east-1) gider,
 * Avrupa'daki sunucudan istek başına ~150–300 ms; getClaims() ise token imzasını projenin genel
 * anahtarıyla (10 dk önbellekli JWKS) yerelde doğrular. Token süresi dolmuşsa yenileme yine ağa çıkar.
 *
 * Fark: iptal edilen oturum token süresi (en fazla 1 saat) bitene kadar geçerli sayılır.
 */
export async function getSessionUser(
    supabase: ClaimsClient,
    accessToken?: string,
): Promise<{ user: SessionUser | null; error: AuthError | null }> {
    const { data, error } = await supabase.auth.getClaims(accessToken)
    if (error || !data?.claims?.sub) return { user: null, error: error ?? null }
    return { user: claimsToSessionUser(data.claims), error: null }
}

/** İstemci tarafındaki UserProvider Supabase'in User tipini bekliyor; yalnızca kimlik alanları dolu */
export function sessionUserToSupabaseUser(user: SessionUser): User {
    return {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
        app_metadata: user.app_metadata,
        aud: "authenticated",
        created_at: "",
        last_sign_in_at: user.last_sign_in_at,
    }
}

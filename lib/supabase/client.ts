import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set"
    )
  }

  return createBrowserClient(url, anonKey)
}

/**
 * Oturumu daha dayanıklı bir şekilde alır. 
 * Supabase bazen anlık olarak null dönebilir, bu durumda kısa bir süre bekleyip tekrar dener.
 */
export async function getSessionSafe() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (session?.access_token) return session

  // Kısa bir bekleme ve tekrar deneme (Network jitter/refresh durumları için)
  await new Promise((resolve) => setTimeout(resolve, 500))
  const { data: { session: retrySession } } = await supabase.auth.getSession()

  return retrySession
}

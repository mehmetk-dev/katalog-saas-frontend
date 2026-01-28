import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

/**
 * Oturumu daha dayanıklı bir şekilde alır. 
 * Supabase bazen anlık olarak null dönebilir, bu durumda kısa bir süre bekleyip tekrar dener.
 */
export async function getSessionSafe() {
  const supabase = createClient()
  let { data: { session } } = await supabase.auth.getSession()

  if (session?.access_token) return session

  // Kısa bir bekleme ve tekrar deneme (Network jitter/refresh durumları için)
  await new Promise((resolve) => setTimeout(resolve, 500))
  const { data: { session: retrySession } } = await supabase.auth.getSession()

  return retrySession
}

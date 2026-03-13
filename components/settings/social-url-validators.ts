import type { Language } from "@/lib/translations"

const messages = {
  tr: {
    invalidUrl: "Geçerli bir URL girin",
    instagramDomain: "Lütfen instagram.com adresi girin",
    youtubeDomain: "Lütfen youtube.com veya youtu.be adresi girin",
    websiteProtocol: "URL http:// veya https:// ile baþlamalý",
  },
  en: {
    invalidUrl: "Please enter a valid URL",
    instagramDomain: "Please use an instagram.com URL",
    youtubeDomain: "Please use a youtube.com or youtu.be URL",
    websiteProtocol: "URL must start with http:// or https://",
  },
} as const

function getMessages(language: Language) {
  return messages[language]
}

export function validateInstagramUrl(value: string, language: Language): string | null {
  if (!value) return null

  try {
    const hostname = new URL(value).hostname
    if (hostname !== "instagram.com" && hostname !== "www.instagram.com") {
      return getMessages(language).instagramDomain
    }
    return null
  } catch {
    return getMessages(language).invalidUrl
  }
}

export function validateYoutubeUrl(value: string, language: Language): string | null {
  if (!value) return null

  try {
    const hostname = new URL(value).hostname
    if (hostname !== "youtube.com" && hostname !== "www.youtube.com" && hostname !== "youtu.be") {
      return getMessages(language).youtubeDomain
    }
    return null
  } catch {
    return getMessages(language).invalidUrl
  }
}

export function validateWebsiteUrl(value: string, language: Language): string | null {
  if (!value) return null

  try {
    const protocol = new URL(value).protocol
    if (protocol !== "http:" && protocol !== "https:") {
      return getMessages(language).websiteProtocol
    }
    return null
  } catch {
    return getMessages(language).invalidUrl
  }
}

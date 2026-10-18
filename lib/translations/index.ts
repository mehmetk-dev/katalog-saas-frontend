import { tr } from "./tr"
import { en } from "./en"

export type Language = "tr" | "en"

export const translations = { tr, en } as const

#!/usr/bin/env node
/**
 * Uygulama arayüzünde ham Tailwind renk sınıflarını (bg-slate-500, text-violet-600,
 * bg-[#cf1414]...) yakalar. Bunların yerine app/globals.css başındaki semantik
 * token'lar kullanılmalı (bg-card, text-muted-foreground, bg-brand, bg-success-soft...).
 *
 * Kullanım: npm run lint:colors
 */
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"

const ROOT = process.cwd()
const SCAN_DIRS = ["app", "components"]

// Kendi renklerini taşıması gereken yerler: müşterinin katalog çıktısı ve basılı belgeler
const IGNORED_PATHS = [
  /^components\/catalogs\/(templates|covers|dividers)\//,
  /^components\/catalogs\/(catalog-preview|catalog-thumbnail|lazy-page|cover-page|category-divider)\.tsx$/,
  /^components\/builder\/preview\/catalog-preview\.tsx$/,
  /^components\/export\//,
  /^app\/export\//,
  /^components\/templates\/preview-data\.ts$/,
  /^components\/billing\/payment-receipt-document\.tsx$/,
]

// Üçüncü parti marka renkleri (paylaşım butonları)
const ALLOWED_HEX = new Set(["#25d366", "#1877f2", "#0088cc", "#0077b5"])

const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose"
const UTILS = "bg|text|border(?:-[trblxy])?|ring|ring-offset|outline|divide|from|via|to|fill|stroke|shadow|decoration|caret"
const RAW_CLASS = new RegExp(
  `(?<![\\w-])(?:[\\w\\-\\[\\]&>*=_.]+:)*(?:${UTILS})-(?:(?:${PALETTE})-\\d{2,3}|\\[(#[0-9a-fA-F]{3,8})\\])(?:\\/\\d+)?(?![\\w-])`,
  "g",
)

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) yield* walk(full)
    else if (/\.(tsx|ts)$/.test(name) && !name.endsWith(".d.ts")) yield full
  }
}

const problems = []
for (const dir of SCAN_DIRS) {
  for (const file of walk(join(ROOT, dir))) {
    const rel = relative(ROOT, file).split("\\").join("/")
    if (IGNORED_PATHS.some((re) => re.test(rel))) continue
    readFileSync(file, "utf8")
      .split("\n")
      .forEach((line, i) => {
        for (const m of line.matchAll(RAW_CLASS)) {
          if (m[1] && ALLOWED_HEX.has(m[1].toLowerCase())) continue
          problems.push(`${rel}:${i + 1}  ${m[0]}`)
        }
      })
  }
}

if (problems.length) {
  console.error(problems.join("\n"))
  console.error(
    `\n✖ ${problems.length} ham renk sınıfı bulundu. Bunun yerine tema token'larını kullan ` +
      `(rehber: app/globals.css dosyasının başı).`,
  )
  process.exit(1)
}
console.log("✓ Ham renk sınıfı yok — tüm arayüz tema token'larını kullanıyor.")

// Çift kodlanmış UTF-8 (mojibake) yakalayıcı: "ş" → "ÅŸ", "ı" → "Ä±" gibi bozulmalar
// bir editör/araç dosyayı yanlış kodlamayla kaydettiğinde oluşur ve kullanıcıya bozuk metin
// olarak görünür (SSS sayfası, Cloudinary hata mesajları ve magazine şablonu böyle bozulmuştu).
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"

const ROOT = process.cwd()
const SCAN_DIRS = ["app", "components", "lib", "backend/src", "tests", "content"]
// Bir araç UTF-8'i ASCII'ye çevirirken karakterleri "?" ile değiştirmişse ("🇹🇷" → "????")
const LOST_CHARS = /\?{3,}/
const MOJIBAKE = /Ã[\u0080-\u00BF‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]|Ä[±°ž\u0178\u009F]|Å[\u009E\u009Fžş\u0178Ÿ]|â€[™œ\u009D”“¦]/

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist") continue
    const full = join(dir, name)
    if (statSync(full).isDirectory()) yield* walk(full)
    else if (/\.(tsx?|mjs|css|mdx?)$/.test(name)) yield full
  }
}

const problems = []
for (const dir of SCAN_DIRS) {
  for (const file of walk(join(ROOT, dir))) {
    const text = readFileSync(file, "utf8")
    const rel = relative(ROOT, file).split("\\").join("/")
    if (text.charCodeAt(0) === 0xfeff) problems.push(`${rel}: dosya başında BOM var`)
    text.split("\n").forEach((line, index) => {
      if (MOJIBAKE.test(line)) problems.push(`${rel}:${index + 1}: bozuk karakter kodlaması → ${line.trim().slice(0, 80)}`)
      else if (LOST_CHARS.test(line)) problems.push(`${rel}:${index + 1}: kaybolmuş karakterler ("???") → ${line.trim().slice(0, 80)}`)
    })
  }
}

if (problems.length) {
  console.error(`✗ ${problems.length} kodlama sorunu (dosyayı UTF-8 olarak yeniden kaydedin):`)
  for (const p of problems) console.error("  " + p)
  process.exit(1)
}
console.log("✓ Karakter kodlaması temiz (UTF-8, BOM yok).")

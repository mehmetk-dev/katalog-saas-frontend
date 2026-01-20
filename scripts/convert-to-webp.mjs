import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '..', 'public');

async function convertToWebP() {
    console.log('🖼️ PNG/JPG dosyaları WebP formatına dönüştürülüyor...\n');

    const files = fs.readdirSync(publicDir);
    let converted = 0;
    let savedBytes = 0;

    for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
            const inputPath = path.join(publicDir, file);
            const outputPath = path.join(publicDir, file.replace(/\.(png|jpg|jpeg)$/i, '.webp'));

            // Zaten webp varsa atla
            if (fs.existsSync(outputPath)) {
                console.log(`⏭️ Atlandı (zaten var): ${file}`);
                continue;
            }

            try {
                const inputStats = fs.statSync(inputPath);

                await sharp(inputPath)
                    .webp({ quality: 80 })
                    .toFile(outputPath);

                const outputStats = fs.statSync(outputPath);
                const saved = inputStats.size - outputStats.size;
                savedBytes += saved;

                console.log(`✅ ${file} → ${path.basename(outputPath)} (${Math.round(saved / 1024)}KB kazanıldı)`);
                converted++;
            } catch (err) {
                console.error(`❌ Hata: ${file}`, err instanceof Error ? err.message : String(err));
            }
        }
    }

    console.log(`\n📊 Sonuç: ${converted} dosya dönüştürüldü, toplam ${Math.round(savedBytes / 1024)}KB kazanıldı`);
}

convertToWebP();

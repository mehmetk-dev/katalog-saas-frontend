const sharp = require('sharp');
const fs = require('fs');

const inputPath = 'temp_icon_source.png';
const outputPath = 'temp_icon_transparent.png';

async function processImage() {
    try {
        console.log('Processing image...');

        const { data, info } = await sharp(inputPath)
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });

        let pixelCount = 0;
        // Iterate through pixels (RGBA)
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Simple threshold for "white"
            // Since the image is generated on white background, this should be fairly safe
            if (r > 240 && g > 240 && b > 240) {
                data[i + 3] = 0; // Set alpha to 0 (transparent)
                pixelCount++;
            }
        }

        console.log(`Made ${pixelCount} pixels transparent.`);

        await sharp(data, {
            raw: {
                width: info.width,
                height: info.height,
                channels: 4
            }
        })
            .png()
            .toFile(outputPath);

        console.log('Image saved to', outputPath);
    } catch (err) {
        console.error('Error processing image:', err);
    }
}

processImage();

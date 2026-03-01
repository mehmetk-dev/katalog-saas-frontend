import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatesDir = __dirname;
const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.tsx') && !f.includes('types'));

for (const file of files) {
    const filePath = path.join(templatesDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    let changed = false;

    if (!content.includes('getHeaderLayout')) {
        content = content.replace(
            /import { buildBackgroundStyle, sanitizeHref, formatProductPrice } from "\.\/utils"/,
            `import { buildBackgroundStyle, sanitizeHref, formatProductPrice, getStandardLogoHeight, getHeaderLayout } from "./utils"`
        );
        changed = true;
    }

    // Attempt to match the old getLogoHeight to isCollisionRight block
    const oldBlockRegex = /const getLogoHeight = \(\) => {[\s\S]*?const isCollisionRight = [^\n]*\n/;

    if (oldBlockRegex.test(content)) {
        content = content.replace(oldBlockRegex, `    const {
        isHeaderLogo,
        logoAlignment,
        titlePosition: finalTitlePosition,
        isCollisionLeft,
        isCollisionCenter,
        isCollisionRight
    } = getHeaderLayout(logoPosition, titlePosition)

    const logoHeight = getStandardLogoHeight(logoSize)\n`);
        changed = true;
    }

    if (content.includes('getLogoHeight()')) {
        content = content.replace(/getLogoHeight\(\)/g, 'logoHeight');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Updated ${file}`);
    }
}

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const emailRegex = /[a-zA-Z0-9._%+-]+@fogcatalog\.com/g;
const summaryRegex = /K\u0131saca/g;

function processFile(filePath) {
    if (!fs.existsSync(filePath)) return;

    const original = fs.readFileSync(filePath, 'utf8');
    let content = original;

    // Replace emails
    content = content.replace(emailRegex, 'info@fogcatalog.com');

    // Replace "Ksaca" with "zet"
    content = content.replace(summaryRegex, '\u00D6zet');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.warn(`Updated: ${filePath}`);
    } else {
        console.warn(`No changes: ${filePath}`);
    }
}

// 1. Process translation file
processFile('lib/translations/legal.ts');

// 2. Process all tsx/ts files in app/legal
function walk(dir) {
    fs.readdirSync(dir).forEach((file) => {
        const fullPath = path.join(dir, file);
        if (fs.lstatSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            processFile(fullPath);
        }
    });
}

walk('app/legal');

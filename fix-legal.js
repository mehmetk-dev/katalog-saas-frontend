const fs = require('fs');
const path = require('path');

const emailRegex = /[a-zA-Z0-9._%+-]+@fogcatalog\.com/g;
const summaryRegex = /Kısaca/g;

function processFile(filePath) {
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Replace emails
    content = content.replace(emailRegex, 'info@fogcatalog.com');

    // Replace "Kısaca" with "Özet"
    content = content.replace(summaryRegex, 'Özet');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    } else {
        console.log(`No changes: ${filePath}`);
    }
}

// 1. Process translation file
processFile('lib/translations/legal.ts');

// 2. Process all tsx files in app/legal
function walk(dir) {
    fs.readdirSync(dir).forEach(file => {
        let fullPath = path.join(dir, file);
        if (fs.lstatSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            processFile(fullPath);
        }
    });
}

walk('app/legal');

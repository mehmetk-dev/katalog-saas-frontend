const fs = require('fs');
const content = fs.readFileSync('components/builder/catalog-editor.tsx', 'utf8');

let braceCount = 0;
let inString = null; // ' or " or `
let inComment = null; // // or /*
let lineNum = 1;

for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '\n') {
        lineNum++;
        if (inComment === '//') inComment = null;
    }

    if (inComment) {
        if (inComment === '/*' && char === '*' && nextChar === '/') {
            inComment = null;
            i++;
        }
        continue;
    }

    if (inString) {
        if (char === inString && content[i - 1] !== '\\') {
            inString = null;
        }
        continue;
    }

    if (char === '/' && nextChar === '/') {
        inComment = '//';
        i++;
        continue;
    }
    if (char === '/' && nextChar === '*') {
        inComment = '/*';
        i++;
        continue;
    }

    if (char === "'" || char === '"' || char === '`') {
        inString = char;
        continue;
    }

    if (char === '{') braceCount++;
    if (char === '}') {
        braceCount--;
        if (braceCount < 0) {
            console.log(`Extra closing brace at line ${lineNum}`);
            braceCount = 0;
        }
    }
}

console.log(`Final brace count (cleaned): ${braceCount}`);

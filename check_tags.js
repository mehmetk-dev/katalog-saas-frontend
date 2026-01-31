const fs = require('fs');
const content = fs.readFileSync('components/builder/catalog-editor.tsx', 'utf8');

const stack = [];
const regex = /<\/?([a-zA-Z0-9]+)(?:\s+[^>]*)?>/g;
let match;
let lineNum = 1;
let lastIdx = 0;

for (let i = 0; i < content.length; i++) {
    if (content[i] === '\n') lineNum++;
}

// Very simple tag parser
let lines = content.split('\n');
lines.forEach((line, i) => {
    let m;
    let lineMatch = line.matchAll(/<(\/?[a-zA-Z0-9]+)(\s|>)/g);
    for (m of lineMatch) {
        let tag = m[1];
        if (tag.startsWith('img') || tag.startsWith('input') || tag.startsWith('br') || tag.startsWith('NextImage') || tag.startsWith('Separator') || tag.startsWith('GripVertical') || tag.startsWith('Trash2') || tag.startsWith('Package') || tag.startsWith('ImageIcon') || tag.startsWith('Upload') || tag.startsWith('ChevronDown') || tag.startsWith('CheckSquare') || tag.startsWith('Layout') || tag.startsWith('Sparkles') || tag.startsWith('Search') || tag.startsWith('HexColorPicker')) {
            // self-closing often
            continue;
        }
        if (tag.startsWith('/')) {
            let open = stack.pop();
            let close = tag.substring(1);
            if (open !== close && !['img', 'input', 'br', 'NextImage', 'Separator'].includes(open)) {
                console.log(`Mismatch at line ${i + 1}: expected </${open}> but got </${close}>`);
            }
        } else {
            if (!line.includes('/>') && !['img', 'input', 'br', 'NextImage', 'Separator'].includes(tag)) {
                stack.push(tag);
            }
        }
    }
});

console.log('Open tags remaining:', stack);

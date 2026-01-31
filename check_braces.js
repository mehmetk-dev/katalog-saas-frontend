const fs = require('fs');
const content = fs.readFileSync('components/builder/catalog-editor.tsx', 'utf8');

function check(charOpen, charClose, name) {
    let count = 0;
    let lineNum = 1;
    for (let i = 0; i < content.length; i++) {
        if (content[i] === '\n') lineNum++;
        if (content[i] === charOpen) count++;
        if (content[i] === charClose) count--;
        if (count < 0) {
            console.log(`Extra closing ${name} at line ${lineNum}`);
            count = 0;
        }
    }
    console.log(`Final ${name} count: ${count}`);
}

check('{', '}', 'brace');
check('(', ')', 'paren');
check('[', ']', 'bracket');

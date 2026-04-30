
const fs = require('fs');
const filename = process.argv[2];
const content = fs.readFileSync(filename, 'utf8');

let pos = 0;
let stack = [];
let results = [];

while (pos < content.length) {
    if (content.startsWith('<div', pos)) {
        // Found opening tag
        let tagStart = pos;
        let tagEnd = content.indexOf('>', pos);
        if (tagEnd === -1) break;
        
        if (content[tagEnd - 1] === '/') {
            // Self-closing
        } else {
            // Not self-closing
            // Find line number
            let lineNo = content.substring(0, tagStart).split('\n').length;
            stack.push({ line: lineNo, type: 'div' });
        }
        pos = tagEnd + 1;
    } else if (content.startsWith('</div>', pos)) {
        stack.pop();
        pos += 6;
    } else if (content.startsWith('<>', pos)) {
        let lineNo = content.substring(0, pos).split('\n').length;
        stack.push({ line: lineNo, type: 'frag' });
        pos += 2;
    } else if (content.startsWith('</>', pos)) {
        let last = stack.pop();
        let lineNo = content.substring(0, pos).split('\n').length;
        results.push({ closeLine: lineNo, openLine: last ? last.line : 'MISSING', type: last ? last.type : 'NONE' });
        pos += 3;
    } else {
        pos++;
    }
}

console.log('Results:', JSON.stringify(results, null, 2));
console.log('Remaining Stack:', JSON.stringify(stack, null, 2));


const fs = require('fs');
const filename = process.argv[2];
const content = fs.readFileSync(filename, 'utf8');

let pos = 0;
let stack = [];

while (pos < content.length) {
    if (content.startsWith('<div', pos)) {
        let tagStart = pos;
        let tagEnd = content.indexOf('>', pos);
        if (tagEnd === -1) break;
        if (content[tagEnd - 1] === '/') {
            // Self-closing
        } else {
            let lineNo = content.substring(0, tagStart).split('\n').length;
            stack.push({ line: lineNo, type: 'div' });
            // console.log(`PUSH div at line ${lineNo}`);
        }
        pos = tagEnd + 1;
    } else if (content.startsWith('</div>', pos)) {
        let lineNo = content.substring(0, pos).split('\n').length;
        let popped = stack.pop();
        console.log(`POP line ${lineNo}: Closed tag from line ${popped ? popped.line : 'MISSING'}`);
        pos += 6;
    } else if (content.startsWith('<>', pos)) {
        let lineNo = content.substring(0, pos).split('\n').length;
        stack.push({ line: lineNo, type: 'frag' });
        pos += 2;
    } else if (content.startsWith('</>', pos)) {
        let lineNo = content.substring(0, pos).split('\n').length;
        let popped = stack.pop();
        console.log(`POP line ${lineNo}: Closed tag from line ${popped ? popped.line : 'MISSING'}`);
        pos += 3;
    } else {
        pos++;
    }
}


const fs = require('fs');

const filename = process.argv[2];
const content = fs.readFileSync(filename, 'utf8');
const lines = content.split('\n');

let depth = 0;
let stack = [];

lines.forEach((line, i) => {
    // Find all tags in this line
    const regex = /<(\/?)div\b|(\/>)/g;
    let match;
    while ((match = regex.exec(line)) !== null) {
        if (match[0] === '<div') {
            // Check if it's self-closing on the same line
            const endIdx = line.indexOf('>', match.index);
            if (endIdx !== -1 && line[endIdx - 1] === '/') {
                // self-closing, do nothing
            } else {
                depth++;
                stack.push(i + 1);
            }
        } else if (match[0] === '</div>') {
            depth--;
            stack.pop();
        } else if (match[0] === '/>') {
            // This is tricky because we don't know if it's a div
            // But our regex only matches <div or />
            // Wait, the regex matches <div OR />. 
            // If we match />, and the last thing we saw was <div, then it's self-closing.
            // But we already handle self-closing <div ... /> above.
        }
    }
    
    // Check for fragment tags too
    const fragRegex = /<>\s*$|<\/\s*>\s*$/g;
    // ... actually let's just stick to divs for now as the error is specifically about div
});

// Let's do a simpler approach: trace line by line and print stack
depth = 0;
stack = [];
lines.forEach((line, i) => {
    let lineTags = [];
    let idx = 0;
    while (true) {
        let openIdx = line.indexOf('<div', idx);
        let closeIdx = line.indexOf('</div>', idx);
        
        if (openIdx === -1 && closeIdx === -1) break;
        
        if (openIdx !== -1 && (closeIdx === -1 || openIdx < closeIdx)) {
            // Found opening tag
            const endIdx = line.indexOf('>', openIdx);
            if (endIdx !== -1 && line[endIdx - 1] === '/') {
                // self-closing
            } else {
                depth++;
                stack.push(i + 1);
            }
            idx = openIdx + 4;
        } else {
            // Found closing tag
            depth--;
            stack.pop();
            idx = closeIdx + 6;
        }
    }
    if (line.includes('<>') || line.includes('</>')) {
        console.log(`Line ${i + 1}: FRAGMENT | Depth: ${depth} | Stack: ${stack.join(', ')} | ${line.trim()}`);
    }
    // Only print if depth changes or it's a suspicious line
    if (line.includes('<div') || line.includes('</div>')) {
        // console.log(`Line ${i + 1}: Depth: ${depth} | Stack: ${stack.join(', ')} | ${line.trim()}`);
    }
});

console.log('Final Stack (Open Lines):', stack.join(', '));

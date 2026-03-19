
const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\Max\\Downloads\\A Codici Main\\RentSyncAI-main\\RentSyncAI-main\\components\\FleetManager.tsx', 'utf8');

function checkTags(text) {
    let stack = [];
    let lines = text.split('\n');
    let regex = /<\/?div[^>]*>/g;
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let match;
        while ((match = regex.exec(line)) !== null) {
            let tag = match[0];
            if (tag.startsWith('</')) {
                if (stack.length === 0) {
                    console.log(`Unmatched </div> at line ${i + 1}`);
                } else {
                    stack.pop();
                }
            } else if (!tag.endsWith('/>')) {
                stack.push({line: i + 1, tag: tag});
            }
        }
    }
    if (stack.length > 0) {
        stack.forEach(s => console.log(`Unclosed div at line ${s.line}: ${s.tag}`));
    } else {
        console.log("div tags are balanced!");
    }
}

checkTags(content);

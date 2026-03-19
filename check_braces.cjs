
const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\Max\\Downloads\\A Codici Main\\RentSyncAI-main\\RentSyncAI-main\\components\\FleetManager.tsx', 'utf8');

function checkBraces(text) {
    let stack = [];
    let lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        for (let j = 0; j < line.length; j++) {
            let char = line[j];
            if (char === '{') stack.push({line: i + 1, char: '{'});
            if (char === '}') {
                if (stack.length === 0) {
                    console.log(`Unmatched } at line ${i + 1}`);
                } else {
                    stack.pop();
                }
            }
        }
    }
    if (stack.length > 0) {
        stack.forEach(s => console.log(`Unclosed { at line ${s.line}`));
    } else {
        console.log("Braces are balanced!");
    }
}

checkBraces(content);

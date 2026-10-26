const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
for (const file of fs.readdirSync(root).filter(file => file.endsWith('.gs') || file.endsWith('.html'))) {
  const source = fs.readFileSync(path.join(root, file), {encoding:'utf8', flag:'r'});
  if (file.endsWith('.gs')) new vm.Script(source, {filename:file});
  if (file.endsWith('.html')) {
    for (const match of source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script\s*>/gi)) {
      new vm.Script(match[1], {filename:file});
    }
  }
}
console.log('CoachIQ Apps Script and browser JavaScript syntax OK');

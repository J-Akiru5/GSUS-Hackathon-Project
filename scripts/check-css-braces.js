const fs = require('fs');
const path = require('path');

function walk(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  files.forEach(f => {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, filelist);
    else filelist.push(full);
  });
  return filelist;
}

const root = path.join(__dirname, '..', 'src');
const allFiles = walk(root).filter(p => p.endsWith('.css'));
let ok = true;
allFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const open = (content.match(/\{/g) || []).length;
  const close = (content.match(/\}/g) || []).length;
  if (open !== close) {
    ok = false;
    console.log(`${f}: {=${open} }=${close} (MISMATCH)`);
  } else {
    console.log(`${f}: {=${open} }=${close}`);
  }
});
process.exit(ok ? 0 : 2);

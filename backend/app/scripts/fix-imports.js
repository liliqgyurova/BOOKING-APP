const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach((file) => {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      walk(filepath, callback);
    } else {
      callback(filepath);
    }
  });
}

function relativePath(from, to) {
  const rel = path.relative(path.dirname(from), to);
  return rel.startsWith('.') ? rel : './' + rel;
}

function fixImportsInFile(filePath, srcRoot) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Премахни версии от импорти
  content = content.replace(/(["'])((?:@?[\w\-\/]+))@\d+\.\d+\.\d+(['"])/g, '$1$2$3');

  // Замени "@/..." с реален относителен път
  content = content.replace(/(["'])@\/([^'"]+)["']/g, (match, quote, importPath) => {
    const absTargetPath = path.join(srcRoot, importPath);
    const relPath = relativePath(filePath, absTargetPath).replace(/\\/g, '/');
    return `${quote}${relPath}${quote}`;
  });

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✅ Fixed: ${filePath}`);
}

const srcDir = path.resolve(__dirname, '../frontend/src'); // адаптирай при нужда

if (!fs.existsSync(srcDir)) {
  console.error(`❌ src directory not found at: ${srcDir}`);
  process.exit(1);
}

walk(srcDir, (filePath) => {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    fixImportsInFile(filePath, srcDir);
  }
});

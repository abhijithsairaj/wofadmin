const fs = require('fs');
const path = require('path');

const srcDir = __dirname;
const distDir = path.join(__dirname, 'dist');

// Clean dist directory
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Copy file helper
function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
}

// Copy directory recursively
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Files to copy to dist
const rootFiles = [
  'index.html',
  'three.min.js',
  '_worker.js',
  '_headers',
  '_routes.json',
  'package.json'
];

for (const file of rootFiles) {
  const fullPath = path.join(srcDir, file);
  if (fs.existsSync(fullPath)) {
    copyFile(fullPath, path.join(distDir, file));
  }
}

// Also create dist/build.js in case working directory / Root directory is set to dist
fs.writeFileSync(
  path.join(distDir, 'build.js'),
  "console.log('✅ Dist assets already present and ready for deployment.');\n"
);

// Directories to copy to dist
const dirs = ['css', 'js', 'data'];
for (const dir of dirs) {
  const fullPath = path.join(srcDir, dir);
  if (fs.existsSync(fullPath)) {
    copyDir(fullPath, path.join(distDir, dir));
  }
}

console.log('✅ Build complete: production bundle written to ./dist');

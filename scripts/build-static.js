const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const root = path.join(__dirname, '..');
const outputRoot = path.join(root, 'client-dist');

function copyDirectory(source, destination) {
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (entry.isDirectory()) copyDirectory(from, to);
    else fs.copyFileSync(from, to);
  }
}

function walk(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(filePath, files);
    else if (entry.name.endsWith('.js')) files.push(filePath);
  }
  return files;
}

fs.rmSync(outputRoot, { recursive: true, force: true });
for (const name of ['ADMIN', 'MAIN']) {
  copyDirectory(path.join(root, 'client', name), path.join(outputRoot, name));
}

const options = {
  compact: true,
  controlFlowFlattening: false,
  identifierNames: 'hexadecimal',
  renameGlobals: false,
  selfDefending: false,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.75,
};

const files = walk(outputRoot);
for (const filePath of files) {
  const source = fs.readFileSync(filePath, 'utf8');
  fs.writeFileSync(filePath, JavaScriptObfuscator.obfuscate(source, options).getObfuscatedCode());
}
console.log(`Obfuscated ${files.length} legacy static JavaScript files`);

const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const options = {
  compact: true,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  identifierNames: 'hexadecimal',
  renameGlobals: false,
  selfDefending: false,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.75,
  unicodeEscapeSequence: false,
};

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(filePath));
    else if (entry.isFile() && entry.name.endsWith('.js')) files.push(filePath);
  }
  return files;
}

function obfuscateFiles(files, label) {
  let count = 0;
  for (const filePath of files) {
    const source = fs.readFileSync(filePath, 'utf8');
    if (!source.trim()) continue;
    try {
      fs.writeFileSync(filePath, JavaScriptObfuscator.obfuscate(source, options).getObfuscatedCode());
      count += 1;
    } catch (error) {
      throw new Error(`Failed to obfuscate ${filePath}: ${error.message}`);
    }
  }
  console.log(`Obfuscated ${count} ${label} JavaScript files`);
}

obfuscateFiles(walk(path.join(__dirname, '..', '.next', 'static')), 'Next.js bundle');
obfuscateFiles(walk(path.join(__dirname, '..', 'public')), 'public asset');

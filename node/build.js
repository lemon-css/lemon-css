import fs from 'fs';
import path from 'path';
import { variables } from '../src/variables.js';
import { reset } from '../src/reset.js';
import { components } from '../src/components.js';
import { parseEngineClass } from '../src/engine.js';

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== 'node' && file !== '.git' && file !== '.vscode') {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      const validExtensions = ['.html', '.php', '.js', '.jsx', '.ts', '.tsx'];
      if (validExtensions.includes(path.extname(file))) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

function build() {
  const allFiles = getAllFiles(process.cwd());
  const foundClasses = new Set();
  const classRegex = /class=["']([^"']+)["']/g;

  allFiles.forEach((filePath) => {
    const content = fs.readFileSync(filePath, 'utf-8');
    let match;
    while ((match = classRegex.exec(content)) !== null) {
      const classList = match[1].split(/\s+/);
      classList.forEach(cls => {
        if (cls.trim()) foundClasses.add(cls.trim());
      });
    }
  });

  let finalCSS = ':root {\n';
  for (const [key, value] of Object.entries(variables)) {
    finalCSS += `  ${key}: ${value};\n`;
  }
  finalCSS += '}\n';
  finalCSS += reset + '\n';

  const generatedStyles = new Set();

  foundClasses.forEach(className => {
    if (generatedStyles.has(className)) return;

    let cssRule = '';

    if (components[className]) {
      cssRule = `.${className} {\n`;
      for (const [prop, val] of Object.entries(components[className])) {
        cssRule += `  ${prop}: ${val};\n`;
      }
      cssRule += '}\n';
    }
    else {
      cssRule = parseEngineClass(className);
    }

    if (cssRule) {
      finalCSS += cssRule + '\n';
      generatedStyles.add(className);
    }
  });

  const distDir = path.join(process.cwd(), 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
  }

  fs.writeFileSync(path.join(distDir, 'lemon.css'), finalCSS);
  console.log('CSS successfully built in dist/lemon.css!');
}

if (process.argv.includes('--watch')) {
  console.log('Lemon CSS is watching for file changes...');
  
  fs.watch(process.cwd(), { recursive: true }, (eventType, filename) => {
    if (filename && !filename.includes('node_modules') && !filename.includes('dist') && !filename.includes('.git') && !filename.includes('node\\') && !filename.includes('node/')) {
      const ext = path.extname(filename);
      if (['.html', '.php', '.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
        console.log(`File changed: ${filename}. Rebuilding...`);
        build();
      }
    }
  });
} else {
  build();
}
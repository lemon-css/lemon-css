import fs from 'fs';
import path from 'path';
import { variables } from '../src/variables.js';
import { reset } from '../src/reset.js';
import { utilities } from '../src/utilities.js';
import { components } from '../src/components.js';

function parseEngineClass(className) {
  const isHover = className.startsWith('hover:');
  const coreClass = isHover ? className.replace('hover:', '') : className;

  let cssProperties = null;
  let customValue = '';
  let isDynamic = false;

  if (utilities.staticClasses && utilities.staticClasses[coreClass]) {
    cssProperties = utilities.staticClasses[coreClass];
  } 
  else {
    // 1/2 Word Prefix (h-, w-, mt-, py-, bg-)
    const match = coreClass.match(/^([a-z0-9]+-)+\[(.*?)\]$/);
    if (match) {
      // Prifix Before 3rd B []
      const prefix = coreClass.substring(0, coreClass.indexOf('['));
      customValue = match[2].replace(/_/g, ' ');
      
      if (utilities.dynamicPrefixes && utilities.dynamicPrefixes[prefix]) {
        const propConfig = utilities.dynamicPrefixes[prefix];
        
        // 1 Object txt-)
        if (typeof propConfig === 'object' && !Array.isArray(propConfig)) {
          // Chack Velue px, rem, em, %, vh, vw Or Numbers
          const isSize = /^[0-9.]+(px|rem|em|%|vh|vw)?$/.test(customValue);
          if (isSize) {
            cssProperties = propConfig.size;
          } else {
            cssProperties = propConfig.color;
          }
        } else {
          // Single Property (ex: bg-, mt- etc)
          cssProperties = propConfig;
        }
        
        isDynamic = true;
      }
    }
  }

  if (!cssProperties) return '';

  const escapedClassName = className
    .replace(/:/g, '\\:')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/#/g, '\\#')
    .replace(/%/g, '\\%');

  const selector = isHover ? `.${escapedClassName}:hover` : `.${escapedClassName}`;
  let rule = `${selector} {\n`;

  if (isDynamic) {
    if (Array.isArray(cssProperties)) {
      cssProperties.forEach(prop => {
        rule += `  ${prop}: ${customValue} !important;\n`;
      });
    } else {
      rule += `  ${cssProperties}: ${customValue} !important;\n`;
    }
  } else {
    for (const [prop, val] of Object.entries(cssProperties)) {
      rule += `  ${prop}: ${val};\n`;
    }
  }

  rule += '}\n';
  return rule;
}

// Project All File Scaned (HTML, PHP, JS etc)
function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      // node_modules & dist Folder Scan None
      if (file !== 'node_modules' && file !== 'dist' && file !== 'node' && file !== '.git') {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      // Scaned File Formate
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

  // Find Class Form All File
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

  // File Name Change
  fs.writeFileSync(path.join(distDir, 'lemon.css'), finalCSS);
  console.log('CSS successfully built in dist/lemon.css!');
}

// --- Watch_Mode_Logic ---
if (process.argv.includes('--watch')) {
  console.log('Lemon CSS is watching for file changes...');
  
  fs.watch(process.cwd(), { recursive: true }, (eventType, filename) => {
    if (filename && !filename.includes('node_modules') && !filename.includes('dist') && !filename.includes('.git') && !filename.includes('node\\')) {
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
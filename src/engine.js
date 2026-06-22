import { variables } from './variables.js';
import { reset } from './reset.js';
import { utilities } from './utilities.js';
import { components } from './components.js';

class LemonEngine {
  constructor() {
    this.generatedStyles = new Set();
    this.styleTag = null;
    this.init();
  }

  init() {
    this.styleTag = document.createElement('style');
    this.styleTag.id = 'lemon-css-engine';
    document.head.appendChild(this.styleTag);

    let baseCSS = ':root {\n';
    for (const [key, value] of Object.entries(variables)) {
      baseCSS += `  ${key}: ${value};\n`;
    }
    baseCSS += '}\n';
    baseCSS += reset;

    this.styleTag.innerHTML = baseCSS;

    this.scanDOM();
    const observer = new MutationObserver(() => this.scanDOM());
    observer.observe(document.body, { subtree: true, childList: true, attributes: true });
  }

  scanDOM() {
    const elements = document.querySelectorAll('*');
    let newStyles = '';

    elements.forEach(element => {
      const classes = Array.from(element.classList);

      classes.forEach(className => {
        if (this.generatedStyles.has(className)) return;

        let cssRule = '';

        if (components[className]) {
          cssRule = `.${className} {\n`;
          for (const [prop, val] of Object.entries(components[className])) {
            cssRule += `  ${prop}: ${val};\n`;
          }
          cssRule += '}\n';
        }
        else {
          cssRule = this.parseEngineClass(className);
        }

        if (cssRule) {
          newStyles += cssRule;
          this.generatedStyles.add(className);
        }
      });
    });

    if (newStyles) {
      this.styleTag.innerHTML += '\n' + newStyles;
    }
  }

  parseEngineClass(className) {
    const isHover = className.startsWith('hover:');
    let coreClass = isHover ? className.replace('hover:', '') : className;

    let isChildSelector = false;
    let childTag = '';
    if (coreClass.startsWith('_')) {
      const childMatch = coreClass.match(/^_(.*?)-/);
      if (childMatch) {
        isChildSelector = true;
        childTag = childMatch[1];
        coreClass = coreClass.replace(`_${childTag}-`, '');
      }
    }

    let cssProperties = null;
    let customValue = '';
    let isDynamic = false;
    let prefix = '';

    if (utilities.staticClasses && utilities.staticClasses[coreClass]) {
      cssProperties = utilities.staticClasses[coreClass];
    } 
    else {
      const match = coreClass.match(/^([a-z0-9]+-)+\[(.*?)\]$/);
      if (match) {
        prefix = coreClass.substring(0, coreClass.indexOf('['));
        customValue = match[2].replace(/_/g, ' ');
        if (utilities.dynamicPrefixes && utilities.dynamicPrefixes[prefix]) {
          cssProperties = utilities.dynamicPrefixes[prefix];
          isDynamic = true;
        }
      }
    }

    if (!cssProperties) return '';

    const escapedClassName = className
      .replace(/:/g, '\\:')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/,/g, '\\,')
      .replace(/#/g, '\\#')
      .replace(/%/g, '\\%');

    let selector = '';
    if (isChildSelector) {
      selector = isHover ? `.${escapedClassName}:hover ${childTag}` : `.${escapedClassName} ${childTag}`;
    } else {
      selector = isHover ? `.${escapedClassName}:hover` : `.${escapedClassName}`;
    }

    let rule = `${selector} {\n`;

    if (isDynamic) {
      if (customValue.startsWith('var(--')) {
        if (prefix === 'bg-') {
          rule += `  background: ${customValue} !important;\n`;
        } else if (prefix === 'txt-') {
          if (customValue.toLowerCase().includes('size') || customValue.toLowerCase().includes('font')) {
            rule += `  font-size: ${customValue} !important;\n`;
          } else {
            rule += `  color: ${customValue} !important;\n`;
          }
        } else if (prefix === 'border-') {
          rule += `  border-color: ${customValue} !important;\n`;
        } else if (typeof cssProperties === 'object' && !Array.isArray(cssProperties)) {
          const keys = Object.keys(cssProperties);
          if (keys.includes('size') || keys.includes('width') || keys.includes('radius')) {
            const prop = cssProperties['size'] || cssProperties['width'] || cssProperties['radius'] || cssProperties[keys[0]];
            rule += `  ${prop}: ${customValue} !important;\n`;
          } else if (keys.includes('color')) {
            rule += `  ${cssProperties['color']}: ${customValue} !important;\n`;
          } else {
            const firstProp = Object.values(cssProperties)[0];
            rule += `  ${firstProp}: ${customValue} !important;\n`;
          }
        } else {
          rule += `  ${cssProperties}: ${customValue} !important;\n`;
        }
      } else {
        if (typeof cssProperties === 'object' && !Array.isArray(cssProperties)) {
          const isNumber = /^-?\d+(\.\d+)?(px|rem|em|%|vh|vw|ch|rem)?$/.test(customValue) || !isNaN(customValue);
          if (isNumber) {
            const prop = cssProperties['size'] || cssProperties['width'] || cssProperties['radius'] || cssProperties['radius-tl'] || Object.values(cssProperties)[0];
            if (cssProperties['radius-tl'] || cssProperties['radius-bl'] || cssProperties['radius-tr'] || cssProperties['radius-br']) {
              for (const [key, propName] of Object.entries(cssProperties)) {
                rule += `  ${propName}: ${customValue} !important;\n`;
              }
            } else {
              rule += `  ${prop}: ${customValue} !important;\n`;
            }
          } else {
            const prop = cssProperties['color'] || cssProperties['background'] || Object.values(cssProperties)[0];
            rule += `  ${prop}: ${customValue} !important;\n`;
          }
        } else if (Array.isArray(cssProperties)) {
          cssProperties.forEach(prop => {
            rule += `  ${prop}: ${customValue} !important;\n`;
          });
        } else {
          rule += `  ${cssProperties}: ${customValue} !important;\n`;
        }
      }
    } else {
      if (typeof cssProperties === 'object' && !Array.isArray(cssProperties)) {
        for (const [prop, val] of Object.entries(cssProperties)) {
          rule += `  ${prop}: ${val};\n`;
        }
      } else {
        rule += `  ${cssProperties}: ${customValue} !important;\n`;
      }
    }

    rule += '}\n';
    return rule;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    new LemonEngine();
  });
}
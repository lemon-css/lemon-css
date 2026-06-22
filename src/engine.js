import { variables } from './variables.js';
import { reset } from './reset.js';
import { utilities } from './utilities.js';
import { components } from './components.js';

export function parseEngineClass(className) {
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
      } else if (prefix === 'bg-' || prefix === 'txt-' || prefix === 'border-') {
        isDynamic = true;
      }
    }
  }

  if (!cssProperties && !isChildSelector && !isDynamic) return '';

  const escapedClassName = className
    .replace(/:/g, '\\:')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/,/g, '\\,')
    .replace(/#/g, '\\#')
    .replace(/%/g, '\\%')
    .replace(/;/g, '\\;');

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
      } else if (typeof cssProperties === 'object' && !Array.isArray(cssProperties) && cssProperties !== null) {
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
      } else if (cssProperties) {
        rule += `  ${cssProperties}: ${customValue} !important;\n`;
      }
    } else {
      if (prefix === 'bg-' && (customValue.includes('linear-gradient') || customValue.includes('radial-gradient') || customValue.includes('gradient'))) {
        rule += `  background: ${customValue} !important;\n`;
      } else if (typeof cssProperties === 'object' && !Array.isArray(cssProperties) && cssProperties !== null) {
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
      } else if (prefix === 'bg-') {
        rule += `  background: ${customValue} !important;\n`;
      } else if (prefix === 'txt-') {
        if (customValue.endsWith('px') || customValue.endsWith('rem') || customValue.endsWith('%') || !isNaN(customValue)) {
          rule += `  font-size: ${customValue} !important;\n`;
        } else {
          rule += `  color: ${customValue} !important;\n`;
        }
      } else if (cssProperties) {
        rule += `  ${cssProperties}: ${customValue} !important;\n`;
      }
    }
  } else {
    if (typeof cssProperties === 'object' && !Array.isArray(cssProperties) && cssProperties !== null) {
      for (const [prop, val] of Object.entries(cssProperties)) {
        rule += `  ${prop}: ${val};\n`;
      }
    } else if (cssProperties) {
      rule += `  ${cssProperties}: ${customValue} !important;\n`;
    }
  }

  rule += '}\n';
  return rule;
}
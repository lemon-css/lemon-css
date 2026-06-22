import { utilities } from './utilities.js';

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
        const propConfig = utilities.dynamicPrefixes[prefix];
        
        if (typeof propConfig === 'object' && !Array.isArray(propConfig)) {
          const isNumberOrSize = /^-?[0-9.]+(px|rem|em|%|vh|vw|ch|rem)?$/.test(customValue) || !isNaN(customValue);
          
          if (prefix === 'txt-') {
            if (isNumberOrSize || customValue.toLowerCase().includes('size') || customValue.toLowerCase().includes('font')) {
              cssProperties = propConfig.size;
            } else {
              cssProperties = propConfig.color;
            }
          } else if (prefix.startsWith('border-')) {
            if (isNumberOrSize || customValue.toLowerCase().includes('px') || customValue.toLowerCase().includes('rem')) {
              cssProperties = propConfig.width;
            } else {
              cssProperties = propConfig.color;
            }
          } else if (prefix.startsWith('rounded-')) {
            cssProperties = Object.values(propConfig);
          } else {
            cssProperties = Object.values(propConfig);
          }
        } else {
          cssProperties = propConfig;
        }
        isDynamic = true;
      }
      else if (prefix === 'bg-' || prefix === 'txt-' || prefix === 'border-') {
        isDynamic = true;
        cssProperties = prefix === 'bg-' ? 'background-color' : (prefix === 'txt-' ? 'color' : 'border-color');
      }
    }
  }

  if (!cssProperties && !isChildSelector) return '';

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
    selector = isHover ? `.${escapedClassName}:hover ${childTag}:hover` : `.${escapedClassName} ${childTag}`;
  } else {
    selector = isHover ? `.${escapedClassName}:hover` : `.${escapedClassName}`;
  }

  let rule = `${selector} {\n`;

  if (isDynamic) {
    if (customValue.startsWith('var(--')) {
      if (prefix === 'bg-') {
        rule += `  background-color: ${customValue} !important;\n`;
      } else if (prefix === 'bg-img-') {
        rule += `  background: ${customValue} !important;\n`;
      } else if (prefix === 'txt-' && (!cssProperties || typeof cssProperties !== 'object')) {
        if (customValue.toLowerCase().includes('size') || customValue.toLowerCase().includes('font')) {
          rule += `  font-size: ${customValue} !important;\n`;
        } else {
          rule += `  color: ${customValue} !important;\n`;
        }
      } else if (cssProperties && typeof cssProperties === 'object' && !Array.isArray(cssProperties)) {
        for (const [key, propName] of Object.entries(cssProperties)) {
          rule += `  ${propName}: ${customValue} !important;\n`;
        }
      } else if (Array.isArray(cssProperties)) {
        cssProperties.forEach(prop => {
          rule += `  ${prop}: ${customValue} !important;\n`;
        });
      } else if (cssProperties) {
        rule += `  ${cssProperties}: ${customValue} !important;\n`;
      }
    } else {
      if (prefix === 'bg-' && (customValue.includes('linear-gradient') || customValue.includes('radial-gradient') || customValue.includes('gradient'))) {
        rule += `  background: ${customValue} !important;\n`;
      } else if (prefix === 'bg-img-') {
        rule += `  background: ${customValue} !important;\n`;
      } else if (cssProperties && typeof cssProperties === 'object' && !Array.isArray(cssProperties)) {
        for (const [key, propName] of Object.entries(cssProperties)) {
          rule += `  ${propName}: ${customValue} !important;\n`;
        }
      } else if (Array.isArray(cssProperties)) {
        cssProperties.forEach(prop => {
          rule += `  ${prop}: ${customValue} !important;\n`;
        });
      } else if (prefix === 'bg-') {
        rule += `  background-color: ${customValue} !important;\n`;
      } else if (prefix === 'txt-' && (!cssProperties || typeof cssProperties !== 'object')) {
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
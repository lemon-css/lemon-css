import { utilities } from './utilities.js';
import { variables } from '../src/variables.js';
import { reset } from '../src/reset.js';
import { components } from '../src/components.js';

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
  } else {
    const match = coreClass.match(/^([a-z0-9]+-)+\[(.*?)\]$/);
    if (match) {
      prefix = coreClass.substring(0, coreClass.indexOf('['));
      customValue = match[2].replace(/_/g, ' ');
      if (utilities.dynamicPrefixes && utilities.dynamicPrefixes[prefix]) {
        const propConfig = utilities.dynamicPrefixes[prefix];
        if (typeof propConfig === 'object' && !Array.isArray(propConfig)) {
          const isNumberOrSize = /^-?[0-9.]+(px|rem|em|%|vh|vw|ch|rem)?$/.test(customValue) || !isNaN(customValue);
          if (prefix === 'txt-') {
            cssProperties = (isNumberOrSize || customValue.toLowerCase().includes('size') || customValue.toLowerCase().includes('font')) ? propConfig.size : propConfig.color;
          } else if (prefix.startsWith('border-')) {
            cssProperties = (isNumberOrSize || customValue.toLowerCase().includes('px') || customValue.toLowerCase().includes('rem')) ? propConfig.width : propConfig.color;
          } else {
            cssProperties = Object.values(propConfig);
          }
        } else {
          cssProperties = propConfig;
        }
        isDynamic = true;
      } else if (prefix === 'bg-' || prefix === 'txt-' || prefix.startsWith('border')) {
        isDynamic = true;
        cssProperties = prefix === 'bg-' ? 'background-color' : (prefix === 'txt-' ? 'color' : 'border-color');
      }
    } else if (coreClass.startsWith('border')) {
      isDynamic = true;
      prefix = coreClass; 
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

  let selector = isChildSelector ? (isHover ? `.${escapedClassName}:hover ${childTag}:hover` : `.${escapedClassName} ${childTag}`) : (isHover ? `.${escapedClassName}:hover` : `.${escapedClassName}`);

  let rule = `${selector} {\n`;

  if (isDynamic) {
    if (prefix.startsWith('border')) {
      let side = prefix === 'border' ? '' : '-' + prefix.split('-')[1];
      let propBase = `border${side}`;
      if (!customValue) {
        rule += `  ${propBase}: 1px solid currentColor !important;\n`;
      } else {
        rule += `  ${propBase}: ${customValue} !important;\n`;
      }
    } else if (prefix === 'bg-') {
      rule += `  background-color: ${customValue} !important;\n`;
    } else if (prefix === 'bg-img-') {
      rule += customValue.includes('gradient') ? `  background: ${customValue} !important;\n` : `  background-image: url('${customValue}') !important;\n`;
    } else if (prefix === 'txt-') {
      rule += (customValue.endsWith('px') || customValue.endsWith('rem') || customValue.endsWith('%') || !isNaN(customValue)) ? `  font-size: ${customValue} !important;\n` : `  color: ${customValue} !important;\n`;
    } else if (typeof cssProperties === 'object' && !Array.isArray(cssProperties)) {
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
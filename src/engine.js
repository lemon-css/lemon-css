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
    const coreClass = isHover ? className.replace('hover:', '') : className;

    let cssProperties = null;
    let customValue = '';
    let isDynamic = false;

    // ১. প্রথমে চেক করবে এটা তোমার staticClasses এর কোন রেডিমেড ক্লাস কি না
    if (utilities.staticClasses && utilities.staticClasses[coreClass]) {
      cssProperties = utilities.staticClasses[coreClass];
    } 
    // ২. যদি রেডিমেড ক্লাস না হয়, তবে চেক করবে থার্ড ব্র্যাকেট [] ওয়ালা কাস্টম ক্লাস কি না
    else {
      const match = coreClass.match(/^([a-z]+-)+\[(.*?)\]$/);
      if (match) {
        const prefix = coreClass.substring(0, coreClass.indexOf('['));
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
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    new LemonEngine();
  });
}
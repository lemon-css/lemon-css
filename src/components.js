export const components = {
  // ১. Primary Button
  'le-btn-primary': {
    'display': 'inline-block',
    'padding': 'var(--space-2) var(--space-5)',
    'background-color': 'var(--primary)',
    'color': 'var(--white)',
    'font-weight': 'var(--600)',
    'border-radius': 'var(--red-md)',
    'text-align': 'center',
    'cursor': 'pointer',
    'transition': 'all var(--delay-300) ease-in-out'
  },

  // ২. Button-2
  'le-btn-secondary': {
    'display': 'inline-block',
    'padding': 'var(--space-2) var(--space-5)',
    'background-color': 'transparent',
    'color': 'var(--primary)',
    'border': 'var(--border-xs) solid var(--primary)',
    'font-weight': 'var(--600)',
    'border-radius': 'var(--red-md)',
    'text-align': 'center',
    'cursor': 'pointer',
    'transition': 'all var(--delay-300) ease-in-out'
  },

  // ৩. Product, Blog Card
  'le-card': {
    'display': 'block',
    'padding': 'var(--space-5)',
    'background-color': 'var(--white)',
    'border': 'var(--border-xs) solid var(--secondary-light)',
    'border-radius': 'var(--red-lg)',
    'box-shadow': 'var(--shadow-md)',
    'transition': 'transform var(--delay-300) ease-in-out'
  }
};
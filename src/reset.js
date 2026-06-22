export const reset = `
*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  font-size: var(--sm);
  font-weight: var(--400);
  line-height: 1.5;
  background-color: var(--white);
  color: var(--dark);
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4, h5, h6, span, a, p {
  font-size: var(--sm);
  font-weight: var(--400);
  line-height: 1.5;
  color: var(--dark);
  -webkit-font-smoothing: antialiased;
}

img, canvas, picture, video, svg {
  display: block;
  max-width: 100%;
}

a {
  text-decoration: none;
  color: inherit;
}

button, input, textarea, select {
  font: inherit;
  outline: none;
}

button {
  cursor: pointer;
  background: none;
  border: none;
}
`;
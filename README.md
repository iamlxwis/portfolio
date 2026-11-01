# lxwis.site

A lightweight static website. Each page keeps its own structure, styles, and behavior in separate files.

## Project structure

```text
/
├── index.html
├── style.css
├── script.js
├── 404.html
├── 404.css
├── 404.js
├── meow/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── arf/
│   ├── index.html
│   ├── style.css
│   └── script.js
└── student/
    ├── index.html
    ├── style.css
    └── script.js
```

## Editing

- Edit a page's `index.html` for its content and structure.
- Edit that page's `style.css` for its appearance.
- Edit that page's `script.js` for its interactions and behavior.
- Keep assets inside the matching page folder when adding page-specific files.

The site is deployed on Vercel as a static site. No build step is required.

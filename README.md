# lxwis.site

A lightweight static website. Each page keeps its own structure, styles, and behavior in separate files.

## Project structure

```text
/
├── index.html
├── style.css
├── script.js
├── 404.html
├── log.html
├── vercel.json
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

- Root `index.html`, `style.css`, and `script.js` are the homepage.
- `404.html` and `log.html` are intentionally standalone pages.
- Each folder contains the HTML, CSS, and JavaScript for that page.
- The clean `/log` URL is routed to `log.html` by `vercel.json`.

The site is deployed on Vercel as a static site. No build step is required.

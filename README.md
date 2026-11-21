# lxwis.site

Personal site and small web apps. Live at https://lxwis.site.

## Repository map

```text
.github/workflows/          GitHub Actions (Android APK)
android/brat/               Capacitor Android wrapper and build scripts
main/                       Vercel deployment root (do not change without updating Vercel)
  index.html                 Homepage
  style.css, script.js       Homepage styles and behavior
  brat/                      BRAT editor
    index.html               Editor UI
    assets/css/              BRAT styles
    assets/js/               BRAT core and enhancements
  meow/                      Cat page
  arf/                       Dog page
  api/                       Serverless API handlers
  privacy.*, cookies.html,
  terms.html, legal.css      Shared legal pages and consent UI
  log.html, 404.html         Standalone pages
  vercel.json                Clean URLs, legacy asset aliases and caching
```

## Apps

- [BRAT](https://lxwis.site/brat) — image/text editor, with [Android build instructions](android/brat/README.md)
- [Meow](https://lxwis.site/meow) — cats
- [Arf](https://lxwis.site/arf) — dogs

## Working on the site

Vercel's **Root Directory is `main/`**. Edit the relevant feature folder and keep the public URLs stable. No frontend bundler is required. The BRAT Android build copies `main/brat/` into the offline app; relative asset paths are rewritten by `android/brat/scripts/prepare-web.mjs`.

The existing `/brat/style.css`, `/brat/script.js`, and `/brat/enhancements.js` URLs remain supported through Vercel rewrites for cached pages.

**Note:** `/student` and `/pbb` are still mentioned in Vercel rewrites, but their source folders are not currently present. No replacement pages were invented.

[Privacy](https://lxwis.site/privacy) · [Cookies](https://lxwis.site/cookies) · [Terms](https://lxwis.site/terms)

© 2026 lxwis

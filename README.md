# lxwis.site

Personal website and mini-apps: https://lxwis.site

## Repository layout

```text
.github/workflows/          CI and Android APK workflow
android/brat/               Capacitor Android app, native plugin, build scripts
main/                       Vercel deployment root
  index.html                 Homepage
  assets/css/home.css        Homepage styles
  assets/js/home.js          Homepage behavior
  assets/shared/             Shared privacy and legal CSS/JS
  legal/                     Privacy, cookies, and terms pages
  brat/                      BRAT editor (assets/css and assets/js)
  meow/                      Cat mini-app (assets/)
  arf/                       Dog mini-app (assets/)
  api/                       Serverless API handlers
  pages/log.html             Changelog page
  404.html                   Not-found fallback (must stay here)
  vercel.json                Vercel routing config (must stay here)
```

## URLs and deployments

Vercel **Root Directory must remain `main/`**. Existing public routes (`/brat`, `/meow`, `/arf`, `/privacy`, `/cookies`, `/terms`, `/log`) are preserved. Legacy asset URLs have rewrite aliases to avoid breaking cached HTML. `/student` and `/pbb` currently point to missing source directories and are retained only as existing route definitions.

Website source documentation: [docs/website.md](docs/website.md).\n\nThe Android build copies `main/brat/` and shared legal resources into its offline WebView bundle. See [Android build guide](android/brat/README.md).

[BRAT](https://lxwis.site/brat) · [Meow](https://lxwis.site/meow) · [Arf](https://lxwis.site/arf) · [Privacy](https://lxwis.site/privacy)

© 2026 lxwis

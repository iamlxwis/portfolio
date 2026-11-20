# lxwis.site

Personal website and small web experiments by **lxwis**.

**Website:** https://lxwis.site

Built primarily with HTML, CSS, and JavaScript, and deployed on Vercel.

## Projects

| Project | Description | Link |
| --- | --- | --- |
| **BRAT** | Minimalist graphic generator with automatic text fitting, color themes, effects, and image export. | [Open BRAT](https://lxwis.site/brat) |
| **Meow** | Cat-themed page. | [Open Meow](https://lxwis.site/meow) |
| **Arf** | Dog-themed page. | [Open Arf](https://lxwis.site/arf) |
| **Student** | Student tools. | [Open Student](https://lxwis.site/student) |
| **Log** | Website updates. | [Open Log](https://lxwis.site/log) |

## BRAT for Android

BRAT is also packaged as an **offline Android app** using Capacitor. The Android project reuses the website's HTML, CSS, and JavaScript.

- **[Download test APK from GitHub Releases](https://github.com/iamlxwis/portfolio/releases/tag/brat-android-test)** — available when the release build has completed successfully.
- **[Android APK build workflow](https://github.com/iamlxwis/portfolio/actions/workflows/brat-android.yml)** — build status and downloadable workflow artifacts.
- **[Android source and instructions](android/brat/README.md)** — local build instructions.

The APK is currently **debug-signed for testing**, not a Google Play release. The web editor is bundled inside the app for offline use. Android download/gallery behavior may vary by device.

## Repository structure

```text
portfolio/
├── .github/
│   └── workflows/
│       └── brat-android.yml
├── android/
│   └── brat/                 # Capacitor Android project
│       ├── capacitor.config.json
│       ├── package.json
│       ├── scripts/
│       └── README.md
├── main/                     # Vercel Root Directory
│   ├── index.html            # Homepage
│   ├── style.css
│   ├── script.js
│   ├── vercel.json
│   ├── 404.html
│   ├── log.html
│   ├── api/
│   ├── brat/                 # BRAT graphic editor
│   │   ├── index.html
│   │   ├── style.css
│   │   └── script.js
│   ├── meow/
│   ├── arf/
│   └── student/
└── README.md
```

## Development

### Website

Vercel's **Root Directory** is set to `main`. The website uses static HTML, CSS, and JavaScript, with no frontend build step. Individual pages live in their own folders.

### Android

The Capacitor app lives in `android/brat/`. GitHub Actions copies the current `main/brat/` editor into the Android package and builds a debug APK.

To build locally, follow the [Android README](android/brat/README.md).

---

Made by [lxwis](https://lxwis.site).

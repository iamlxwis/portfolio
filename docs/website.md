# Website source

**Vercel root: `main/`** — do not change without reconfiguring the project.

| Path | Purpose |
| --- | --- |
| `index.html` | Homepage |
| `assets/css/home.css` | Homepage styles |
| `assets/js/home.js` | Homepage behavior |
| `assets/shared/` | Privacy UI and shared legal stylesheet |
| `legal/` | Privacy, cookies and terms HTML pages |
| `brat/` | BRAT editor with `assets/css/` and `assets/js/` |
| `meow/`, `arf/` | Self-contained mini-apps with `assets/` |
| `api/` | Serverless handlers |
| `log.html`, `404.html` | Standalone pages |
| `vercel.json` | URL aliases and caching |

All existing public URLs are maintained through `vercel.json` rewrites. The Android build script copies shared resources from `assets/shared/` and `legal/` into its offline bundle.

See [project README](../README.md).

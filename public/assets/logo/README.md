# Red Ant Media — brand assets

Vector versions traced from the original artwork in `public/redant-logo.png`.

| File | Wordmark colour | Use on | Public URL |
| --- | --- | --- | --- |
| `redant-logo-light.svg` | White `#FFFFFF` + red ant | **Dark** backgrounds (dark theme) | `/brand/redant-logo-light.svg` |
| `redant-logo-dark.svg` | Near-black `#171717` + red ant | **Light** backgrounds (light theme) | `/brand/redant-logo-dark.svg` |
| `redant-icon.svg` | Red "a" ant mark only | Favicon, avatar, app icon | `/brand/redant-icon.svg` |
| `redant-icon-512.png` | Red "a" ant mark, transparent | Social / PWA / places that need PNG | `/brand/redant-icon-512.png` |

Brand colours: red `#FF0000`, dark text `#171717` (matches `--foreground`), light text `#FFFFFF`.

Logo aspect ratio: 909 × 333 (≈ 2.73 : 1). Icon: 1 : 1.

## Favicon (wired up automatically by Next.js)

- `src/app/favicon.ico` — 16/32/48 px
- `src/app/icon.svg` — scalable favicon for modern browsers
- `src/app/apple-icon.png` — 180 × 180, white background (iOS home screen)

## Usage example (theme-aware)

```tsx
import Image from "next/image";

<Image src="/brand/redant-logo-dark.svg"  alt="Red Ant Media" width={164} height={60} className="block dark:hidden" priority />
<Image src="/brand/redant-logo-light.svg" alt="Red Ant Media" width={164} height={60} className="hidden dark:block" priority />
```

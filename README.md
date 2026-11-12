# Vansh Sharma — 3D Portfolio

An interactive 3D portfolio built with Three.js. The camera flies along a Catmull-Rom
spline through a WebGL scene while scrolling, with a HUD overlay that swaps sections
(home, three project cards, contact) as the camera passes each waypoint.

## Stack

- **Three.js** — scene, spline camera path, CRT post-processing shader
- **Vite** — dev server and bundler
- Vanilla JS, no UI framework

## Run locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

## Build

```bash
npm run build     # outputs to dist/
npm run preview   # serve the production build locally
```

## Structure

```
index.html            HUD markup, preloader, motion-consent gate
styles.css            HUD styling and typography
src/main.js           App bootstrap, preloader, section transitions
src/scene/            SceneManager, CameraPath, CRT shader, post-processing
src/scroll/           ScrollController — damped scroll → 0..1 progress
src/interaction/      TiltController — device orientation parallax
src/ui/               ScrambleText — decrypt-on-reveal text effect
assets/fonts/         Self-hosted woff2 fonts
```

## Deploy

The build output in `dist/` is static, so it can be served by GitHub Pages, Netlify,
Vercel, or any static host.

For GitHub Pages, set `base` in a `vite.config.js` to your repo name, build, and
publish `dist/` — for example with `gh-pages` or a Pages workflow.

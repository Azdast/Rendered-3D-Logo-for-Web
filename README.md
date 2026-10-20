# Rendered 3D Logo for Web

<!-- Main photo: save your best render as docs/images/preview.png -->

![Main preview](/doc/images/pe.png)

A web project for showing a rendered 3D logo in the browser, built with Next.js.

> **Status:** early setup. The app is still the default Next.js starter page; the 3D logo isn't added yet.

## Tech Stack

- [Next.js](https://nextjs.org) 16 (App Router)
- [React](https://react.dev) 19
- [Tailwind CSS](https://tailwindcss.com) 4
- TypeScript
- [Bun](https://bun.sh) as the package manager (`bun.lock`)
- ESLint

## Getting Started

Install dependencies:

```bash
bun install
```

Run the dev server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The page auto-updates when you edit `app/page.tsx`.

npm, yarn and pnpm also work (`npm run dev`, etc.), but the lockfile is for Bun.

## Scripts

| Command         | What it does                 |
| --------------- | ---------------------------- |
| `bun dev`       | Start the development server |
| `bun run build` | Create a production build    |
| `bun start`     | Run the production build     |
| `bun run lint`  | Lint the code with ESLint    |

## Project Structure

```
app/            Pages, layout and global styles (App Router)
  page.tsx      Home page
  layout.tsx    Root layout and fonts
  globals.css   Tailwind import and theme colors
public/         Static assets
next.config.ts  Next.js config
```

## What I Learned

Notes from building this project.

### Reflections only on the objects

- A reflective floor shouldn't mirror everything in the scene (lights, helpers, background stuff). Limit what it reflects, for example by putting only the logo on its own layer and having the reflection camera render just that layer.
- Fade the reflection out with distance (or a gradient/alpha map) so it looks like a glossy surface and not a perfect mirror.
- Lower the reflection resolution if performance drops. It's a cheap trade because reflections are usually blurry anyway.

### Lighting

- A key light, a fill light and a rim light give the logo depth and a clear shape.
- An environment map (HDRI) gives realistic reflections on metal and glass materials, which direct lights alone can't do.
- Soft shadows and light intensity matter a lot. Too bright and the material looks flat.

### Texturing the plane

- The floor plane needs its own material settings (roughness, metalness, color) to look like a real surface.
- Roughness/normal maps add detail without adding geometry.
- Set texture wrapping and repeat so the texture tiles instead of stretching across the plane.

### Other things

- Keep the 3D scene in a client component and load it without SSR, since WebGL only runs in the browser.
- Handle resize and device pixel ratio so the canvas stays sharp on every screen.
- Dispose of geometries, materials and textures when the component unmounts to avoid memory leaks.

## Deploy

The easiest way to deploy is with [Vercel](https://vercel.com/new). See the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for other options.

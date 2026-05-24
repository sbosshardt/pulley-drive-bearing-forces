# Two-Pulley Bearing Force Visualizer

Client-side web app for understanding bearing loads in a two-pulley no-slip belt system.

Live demo: [https://sbosshardt.github.io/pulley-drive-bearing-forces/](https://sbosshardt.github.io/pulley-drive-bearing-forces/)

## Model Scope

- Driver pulley is the top pulley.
- Driven pulley is the bottom pulley.
- Inputs are SI units:
  - Driver torque `T_driver` in `N·m`
  - Driver radius `r_driver` in `m`
  - Driven radius `r_driven` in `m`
  - Center distance `C` in `m`
  - Preload tension `F_preload` in `N`
- Coordinate convention:
  - `+x` is right
  - `+y` is up
  - Angles are measured CCW from `+x` via `atan2(F_y, F_x)`

## Core Equations

- Circumferential transmitted force:
  - `F_t = T_driver / r_driver`
- Belt side tensions:
  - `F_tight = F_preload + F_t / 2`
  - `F_slack = F_preload - F_t / 2`
- Practical warning if `F_slack < 0` (preload is too low for requested torque).

Bearing loads are calculated as vector sums of the two belt-span tension vectors at each pulley:

- `F_b,preload`: preload-only baseline (`T_driver = 0`)
- `DeltaF_b,trans`: transmission-only increment (`current - preload-only`)
- `F_b,total`: total bearing load under current operating point

Each vector is reported as:

- Magnitude `|F|`
- Angle `theta` in degrees
- Cartesian components `F_x`, `F_y`

## Validity Checks

- Input constraints:
  - `r_driver > 0`
  - `r_driven > 0`
  - `C > 0`
  - `F_preload >= 0`
- Geometry feasibility for external tangency:
  - `C > |r_driver - r_driven|`

If geometry is invalid, the app shows warnings and suppresses force tables/diagram details that depend on tangency.

## Development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run lint
npm run test
npm run build
```

## Static Hosting (GitHub Pages)

The Vite config uses a relative base path (`base: './'`) so the app can be hosted from GitHub Pages or other static file hosts without backend routing.

Build artifacts are emitted to `dist/`.

This repository includes `.github/workflows/deploy-pages.yml` to build and deploy automatically on every push to `main`.

After pushing the workflow:

1. Open repository **Settings > Pages**
2. Set **Source** to **GitHub Actions**
3. Push to `main` (or run the workflow manually)

GitHub will publish the app from the generated Pages artifact.

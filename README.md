# Two-Pulley Bearing Force Visualizer

Client-side web app for understanding bearing loads in a two-pulley no-slip belt system.

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
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

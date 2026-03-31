# Asset Layout

This folder is intended for game art assets.

Suggested structure:

- `/assets/characters` — character sprites, bodies, etc.
- `/assets/portraits` — portrait images for dialogue and UI
- `/assets/equipment` — layered equipment overlays (weapon, armor, etc.)
- `/assets/ui` — UI elements (icons, frames, buttons)
- `/assets/tilesets` — map tilesets

Current asset loading is handled by the Babylon.js runtime and helpers under `src/utils/assetPaths.ts` plus the world/environment builders.

Future plan:
- Replace placeholder geometry and lightweight texture use with more authored environment/model coverage.
- Maintain consistent naming conventions so data files can refer to them by key.

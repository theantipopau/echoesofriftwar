# Asset Layout

This folder is intended for game art assets.

Suggested structure:

- `/assets/characters` — character sprites, bodies, etc.
- `/assets/portraits` — portrait images for dialogue and UI
- `/assets/equipment` — layered equipment overlays (weapon, armor, etc.)
- `/assets/ui` — UI elements (icons, frames, buttons)
- `/assets/tilesets` — map tilesets

Currently, the project uses procedurally generated placeholder textures in `src/scenes/PreloadScene.ts`.

Future plan:
- Replace procedural placeholders with real sprites.
- Maintain consistent naming conventions so data files can refer to them by key.

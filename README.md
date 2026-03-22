# Echoes of the Riftwar

> **A Babylon.js real-time RPG prototype exploring reactive world state, dynamic quest progression, and environmental storytelling.**

![quest](public/icons/quest.svg) ![camp](public/icons/poi-camp.svg) ![dungeon](public/icons/poi-dungeon.svg) ![rift](public/icons/poi-rift.svg)

## Overview

**Echoes of the Riftwar** is an isometric RPG built on Babylon.js that emphasizes content-driven systems, meaningful player progression through quests and world state changes, and reusable architecture for expanding game worlds.

### Current Features

- 🗺️ **Multi-region world** with interconnected frontiers (Crydee, Forest Outskirts, Warfront Approach)
- 🎯 **Dynamic quest system** supporting kill/visit/talk objectives with prerequisite chaining
- 🌍 **World state management** — quests and dialogue unlock regions, spawn NPCs, and visually transform locations
- 🏰 **Mini-dungeon architecture** — reusable interior generation for contained encounters (Culvert Breach)
- 💬 **Conditional dialogue trees** — NPC conversations branch based on quest state, inventory, and world progression
- 🎒 **Inventory & equipment** system with persistent player progression across region travel
- ⚔️ **Real-time combat** with simple AI patrolling and aggro
- 📊 **JSON-driven content pipeline** — add regions, NPCs, enemies, items, quests via data files
- 🎮 **Scalable design** — patterns established for adding new content without touching core systems

## Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation & Development

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Controls

| Action | Key |
|--------|-----|
| Move | W/A/S/D or arrow keys |
| Attack | Space (near enemies) |
| Interact / Talk | E (near NPCs) |
| Inventory | I |
| Equip/Unequip | Click items in inventory |

## World Progression

### Current Regions

1. **Crydee** — Starting frontier town. Introductory quests and basic encounters.
2. **Forest Outskirts** — Transition zone with escalating enemies and story hooks.
3. **Warfront Approach** — Active war zone with trenches, fortifications, and dispatch recovery objective.
4. **Culvert Breach** (Mini-dungeon) — Underground sealed passage beneath the war road. Defeat the Rift overseer to recover Krondor dispatches.
5. **Outer Roads to Krondor** (Preview) — Unlocked after dispatch recovery; playable content coming soon.

### Quest Pipeline

- **Frontier quests** progress through Crydee and initiate forest exploration
- **Warfront quests** escalate player commitment and unlock the Culvert Breach dungeon
- **Dispatch turn-in** completes the Culvert quest, triggers world state changes, and opens the eastern route
- **Consequence chains** new NPCs appear, landmarks change, and dialogue evolve based on dispatch recovery

## Content Pipeline (Data-Driven)

All game content lives in JSON files under `src/data/content/`:

```
src/data/content/
├── regions.json      # World regions, POIs, transitions, unlock requirements
├── npcs.json         # NPCs, dialogue trees, conditional branches
├── quests.json       # Quest definitions, objectives, rewards
├── enemies.json      # Enemy stats, loot tables, behaviors
├── items.json        # Items, equipment, quest rewards
└── dungeons.json     # Dungeon layouts, encounters, interactables
```

### Adding New Content

1. **New dialogue option?** Edit the NPC tree in `npcs.json`.
2. **New region?** Add to `regions.json` with `unlockRequirements` gating and state variants for conditional spawning.
3. **New quest chain?** Add to `quests.json` with `requiredObjectiveIds` for chaining turns-in across NPCs.
4. **New enemy encounter?** Add `enemies.json` entry, reference in region `enemyPool` or spawn points.
5. **World state changes?** Use `setWorldState:` action in dialogue, checked by NPC `conditionalStartNodes` and region `stateVariants`.

Content schema is defined in `src/data/types.ts`.

## Architecture

### Core Systems

- **GameManager** — Initializes all managers and orchestrates scene setup
- **WorldManager** — Region/dungeon generation, enemy spawning, dialogue, combat, POI discovery
- **RegionProgression** — Tracks unlocked regions, discovered POIs, completed quests, world-state tags
- **QuestJournal** — Active quest tracking, objective progress, quest completion checks
- **UIManager** — UI panels, notifications, route display, inventory
- **DungeonManager** — Procedural interior generation, encounter tracking, interactables

### Entity Classes

- **Player3D** — Playable character with movement, combat, equipment, inventory
- **NPC3D** — Non-player characters with dialogue trees and interaction
- **Enemy3D** — Hostile entities with patrol and combat AI
- **LootDrop3D** — Items that fall from defeated enemies

## Build & Deploy

### Production Build

```bash
npm run build
# Output: dist/ (ready for hosting)
```

### GitHub Pages / Cloudflare Pages

1. Push this repository to GitHub
2. Create a Pages project and connect your repo
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Deploy

### Environment Size

- Main bundle: **~118 KB** (gzipped ~32 KB)
- Babylon.js core: **~1.0 MB** (gzipped ~231 KB)
- Total: **~1.1 MB** (gzipped ~263 KB)

## Development Roadmap

### In Progress
- Quest testing and dispatch turn-in validation
- Additional consequence chains (NPC state evolution)
- Expanding Outer Roads to Krondor with playable encounters
- World state-driven cascading events

### Planned
- Player equipment affecting combat/stats
- Training system for leveling
- Advanced enemy AI (formation tactics, special attacks)
- Fast travel and region map
- Save/load system
- Dialogue bark system and ambient NPC routines

## Project Structure

```
src/
├── config/          # Game balance constants
├── data/
│   ├── content/     # JSON content files (regions, NPCs, quests, etc.)
│   └── types.ts     # Content and game type definitions
├── entities/        # 3D entity classes (Player, NPC, Enemy)
├── systems/
│   ├── content/     # Content managers (ItemManager, NPCManager, etc.)
│   ├── game/        # Game logic (GameManager, QuestJournal, RegionProgression)
│   ├── ui/          # UI system and state types
│   └── world/       # World generation and interaction (WorldManager, DungeonManager)
└── main.ts          # Entry point
```

## Git Workflow

This project uses a content-first approach:

1. **Data changes** (new quests, NPCs, items) can be made without code changes
2. **System improvements** (new managers, features) extend existing patterns
3. **Bug fixes** are isolated and validated with production builds

## License

© 2025 Echoes of the Riftwar Prototype. All rights reserved.

---

**Questions or contributions?** Open an issue or PR on GitHub.

![dungeon](public/icons/poi-dungeon.svg) ![rift](public/icons/poi-rift.svg) ![bag](public/icons/bag.svg)

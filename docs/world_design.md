# World Map Design — Midkemia (Game Interpretation)

## Design Goals

- **Modular & Expandable**: Each region is a self-contained Phaser scene with its own assets, NPCs, and events, allowing on-demand loading and future expansion.
- **Scalable Map**: Use region-based loading (not one massive map) so the game can grow without performance issues.
- **Lore-Driven**: Keep the setting inside the Riftwar timeline but focused on the player’s perspective; canon characters appear as meaningful events, not constant companions.
- **Dynamic & Reactive**: Regions change based on story progression (e.g., Tsurani incursions, rift instability, NPC decisions).

---

## Region System (High Level)

### Region Scene Architecture

Each region is implemented as a Phaser `Scene`. Scenes are loaded/unloaded dynamically using `scene.start()`/`scene.run()`.

**Required features per region scene**:
- Terrain layer(s) (tilemap or procedural)
- NPC placement system (data-driven)
- Encounter triggers (rifts, patrols, events)
- Fast-travel nodes (unlockable travel points)
- Region-specific music/ambience

### Region Configuration (Data-Driven)

Keep a JSON/TS config per region describing:
- `id`, `name`, `description`
- `connections`: adjacent region IDs
- `fastTravelNodes`: named nodes with world coordinates
- `pointsOfInterest`: towns, dungeons, rifts
- `spawnTables`: enemies and encounter types
- `npcTemplates`: which NPCs spawn in the region, with roles

**Example config structure** (TypeScript):

```ts
export interface RegionConfig {
  id: string
  name: string
  description: string
  faction?: string
  connections: string[]
  fastTravelNodes: Array<{ id: string; name: string; x: number; y: number }>
  pointsOfInterest: Array<{ id: string; name: string; type: 'town' | 'dungeon' | 'rift' | 'camp'; x: number; y: number }>
  spawnTables: Array<{ category: 'wild' | 'patrol' | 'rift'; weight: number; enemies: string[] }>
  npcSpawns: Array<{ templateId: string; x: number; y: number; guardRadius?: number }>
}
```

### Region Loading Logic

- Core `WorldMap` manager tracks current region and unlocked fast travel nodes.
- When player enters a region boundary, the manager triggers `scene.start(regionSceneKey)`.
- Regions can preload adjacent regions for seamless transitions (optional).

---

## Core Regions (Phase 1–2 Focus)

### 1) Crydee (Starting Region)

**Tone**: Borderland frontier; mostly safe but with rising tension.

**Key features**:
- Castle Crydee fortress (hub)
- Small villages (keeper, tavern, market)
- Forested hills, cliffs, coastal paths
- Tutorial encounters (goblins, bandits, weak rift horrors)
- Fast travel: Crydee keep, Larat village, coastal ferry

**Purpose**:
- Introduce movement, combat, inventory, dialog.
- Establish war tension: rumors of rift sightings.

---

### 2) Western Realm Wilderness

**Tone**: Quiet, mysterious, old magic.

**Key features**:
- Dense woods, ruins, hidden groves
- Relic sites (Greater Path fragments)
- Encounters with patrols, enchanted beasts, rift-tainted creatures
- Dynamic event: wandering relic guardian appears randomly

**Purpose**: Introduce lore of the Greater Path and relic hunting.

---

### 3) Krondor (Major City Hub)

**Tone**: bustling, political, dangerous beneath the surface.

**Districts**:
- Market (shops, crafting, street vendors)
- Docks (smuggling, rift-related goods)
- Noble quarter (Arutha-style politics, noble quests)
- Underworld (rogues, spies, crime rings)

**Purpose**:
- Main quest hub with branching storylines
- Introduces faction reputation systems
- Empowers player choice: diplomacy, espionage, or force

---

### 4) Borderlands / Warfront

**Tone**: chaotic, frontline conflict.

**Key features**:
- Ruined keeps, campfires, battlefields
- Rift tears appear randomly and shift the terrain
- Tsurani patrols + Rift creatures

**Purpose**: Transition into large-scale war; show consequences of player actions.

---

### 5) Rift Zones (Dynamic Areas)

**Tone**: surreal, dangerous.

**Key features**:
- Shifting terrain and warped physics
- Increased enemy difficulty
- Temporary events (rifts opening/closing, calm periods)

**Purpose**: Provide challenge spikes and reward high-level exploration.

---

## Optional Expansion Regions (Structure Only)

- **Stardock** – Arcane academy / mage hub (magic-focused quests)
- **Eastern Kingdoms** – Rural duchies under stress (civil war flavor)
- **Kelewan** – Full expansion: hostile Tsurani homeland, new mechanics, mastery of Greater Path

---

## Key Characters (Canon + Original)

### Pug (Milamber)

**Role**: Mentor / magic guide.

**Use**:
- Appear in magical disturbances
- Give quests to discover rifts and artifacts
- Teach Greater Path concepts through narrative

**Arc**:
- Leads player toward understanding rifts
- Introduces “greater path” mechanics (relics, spellcasting upgrades)

---

### Tomas

**Role**: Martial powerhouse (Valheru heritage).

**Use**:
- Shows up in war zones and boss encounters
- Offers combat-focused guidance

**Arc**:
- Demonstrates cost of raw power
- Influences player toward warrior paths

---

### Arutha

**Role**: Political hub leader (Krondor).

**Use**:
- Offers questlines tied to factions, diplomacy, and war strategy
- Rewards player for controlling territories and decisions

**Arc**:
- Presents moral choices that affect region stability

---

### Macros the Black (optional, late game)

**Role**: Hidden manipulator.

**Use**:
- Appears via subtle clues, notes, and whispers
- Provides endgame narrative hook: cosmic war beneath the Rift

---

## Original NPC Types (Data-Driven)

Each NPC should have:
- **Name**
- **Role** (quest giver, merchant, guard, scholar, etc.)
- **Portrait** (UI asset)
- **Short bio**
- **Quest hooks** (primary, secondary)

**Example NPC template structure**:

```ts
export interface NpcTemplate {
  id: string
  name: string
  portraitKey: string
  role: 'merchant' | 'quest' | 'trainer' | 'spy' | 'guard' | 'story'
  faction?: string
  description: string
  baseDialogId: string
  quests?: string[]
}
```

---

## Player Character Archetype Paths (Core Systems)

### Riftwalker (Magic Path)

- **Focus**: spellcasting, Greater Path progression
- **Gameplay**: high damage, fragile defenses, powerful area effects
- **Narrative**: explore rifts, acquire relics, learn hidden lore

### Warlord (Combat Path)

- **Focus**: weapon mastery, gear progression
- **Gameplay**: high survivability, crowd control, battlefield mobility
- **Narrative**: lead battles, shape war outcomes

### Shadow Agent (Rogue/Stealth Path)

- **Focus**: stealth, infiltration, utility
- **Gameplay**: evasion, traps, social manipulation
- **Narrative**: Krondor underworld, political espionage

### Diplomat (Hybrid Path)

- **Focus**: dialogue, alliances, reputation
- **Gameplay**: balanced combat + social skills
- **Narrative**: influence factions and avoid all-out war

---

## Encounter Design (Important)

### Major Character Encounters

- **Pug**: appears during magical disturbances, teaches Greater Path.
- **Tomas**: appears in war zones / boss fights, tests combat builds.
- **Arutha**: appears in Krondor, drives political story.

Encounters should be:
- **Rare**: high-impact, not constant
- **Meaningful**: choices matter and impact story
- **Thematic**: tied to region tone and narrative arc

---

## Implementation Notes (System Architecture)

### 1) Region Loading

- Regions are Phaser scenes (e.g., `CrydeeScene`, `KrondorScene`).
- A `WorldManager` holds `currentRegionId` and a mapping to scene keys.
- When entering a new region, `WorldManager` calls `scene.start(regionSceneKey, { from: prevRegion })`.

### 2) Data-driven NPCs / Quests / Events

- Keep most world data in JSON/TS files:
  - `regions.ts` (region configs)
  - `npcs.ts` (NPC templates)
  - `quests.ts` (quest definitions)

- Region scenes read the config and spawn NPCs via a generic factory.

### 3) Fast Travel System

- Unlockable travel nodes stored in player save state (localStorage for now).
- Fast travel UI uses region config nodes.
- Travel between nodes triggers scene transitions.

### 4) Rift Event System

- `RiftManager` spawns temporary `RiftZone` events in regions based on probability.
- Rift events modify spawn tables, terrain overlays, and can grant rare rewards.

---

## Next Steps (Implementation Plan)

1. **Implement core region manager + scene loader**
2. **Build NPC/Dialogue system** (Phase 3) with portraits + branching dialog
3. **Add quest system** (linked to NPCs and regions)
4. **Implement enemy encounters** (Phase 4)

---

*This document is designed so the game can expand naturally while remaining rooted in Riftwar lore and giving the player agency to shape the world.*

# Echoes of the Riftwar Roadmap

This roadmap reflects the current Babylon.js project state as of March 31, 2026.

## Current State

- Core loop is playable: exploration, melee combat, quests, region unlocking, dungeon flow, inventory, equipment stats, save/load, and world-state progression.
- Outer Roads to Krondor is already playable and functions as the current chapter endpoint.
- The biggest gaps are no longer engine migration or core RPG scaffolding. They are system depth, asset replacement, and post-chapter content density.

## Priority Order

### 1. Finish the obvious placeholders

- Replace merchant and trainer placeholder dialogue responses with real interaction flows.
- Expand environmental props and named-character presentation so the world stops leaning on primitive geometry.
- Reduce production bundle size by splitting heavy Babylon/runtime chunks where practical.

### 2. Deepen the combat layer

- Add at least one active player ability branch beyond dodge and basic melee.
- Introduce status effects that matter mechanically and read clearly in the UI.
- Improve elite/boss encounters with bespoke behavior instead of pure stat inflation.

### 3. Strengthen regional reactivity

- Add more world-state variants after major quest completions so regions feel transformed, not merely unlocked.
- Give settlements more ambient dialogue, bark logic, and visible recovery/decline states.
- Make roads, relay posts, and checkpoints visibly evolve as the player secures them.

### 4. Expand content eastward

- Build the Eastern Passage into the next playable sector rather than leaving it as a narrative edge.
- Introduce the first inland stronghold or trade enclave as the next chapter hub.
- Use that expansion to establish the next faction layer: relay corps, merchant syndicates, garrison command, and Rift scholars in tension with each other.

## Visual Asset Priorities

- Replace placeholder props first: crates, banners, braziers, wagons, relay fixtures, barricades.
- Add portraits for named NPCs who anchor quest chains and world-state milestones.
- Improve player and elite-enemy silhouettes so combat readability survives at a distance.
- Add more region-specific decals and sky/atmosphere accents before attempting broad high-cost model replacement.

## Lore And Worldbuilding Priorities

- Build out the roadwarden relay network as a recurring institution, not just a quest wrapper.
- Treat reopened trade roads as political events, not just traversal unlocks.
- Establish three inland pressures in dialogue and quests: supply scarcity, Rift instability, and competing war aims.
- Seed future regions through survivors, dispatch logs, signal officers, clergy, and merchants instead of exposition dumps.

## NPC Expansion Targets

- Crydee: add more grounded civilian voices so the frontier feels lived in before it feels threatened.
- Warfront Approach: add command, logistics, and survivor perspectives to balance combat-heavy storytelling.
- Outer Roads: use post-ritual NPCs to foreshadow the inland chapter and show recovery in progress.
- Future hubs: build NPC clusters around institutions, not isolated quest givers.

## Do Not Treat As Current

- `CODEBASE_ANALYSIS.md` is a Phaser-era artifact.
- `docs/world_design.md`, `docs/GUI_IMPROVEMENTS.md`, and `docs/VISUAL_TRANSFORMATION.md` contain useful ideas, but not an accurate implementation snapshot.
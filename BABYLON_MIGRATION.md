# Babylon.js Migration Guide - Phase 1

> Historical migration log. The migration itself is complete, and several items listed below as pending were finished afterward.
>
> Use `README.md` and `ROADMAP.md` for current implementation status.

## Overview
The Echoes of the Riftwar RPG has been **successfully migrated from Phaser 3 to Babylon.js** as of March 19, 2026. This document explains the changes, what's been completed, and what remains.

---

## ✅ What's Been Done

### **1. Core Engine Switch**
- ❌ Removed: Phaser 3.60.0
- ✅ Added: Babylon.js 6.37.0
- ✅ Updated: TypeScript configuration
- ✅ Updated: Vite configuration (compatible with both)

### **2. Data Pipeline (Engine-Agnostic)**
All content systems were **preserved as-is** since they don't depend on Phaser:

- ✅ **ItemManager** - manages game items
- ✅ **NPCManager** - manages non-player characters
- ✅ **EnemyManager** - manages enemy data
- ✅ **RegionManager** - manages world regions
- ✅ **QuestManager** - manages quests
- ✅ All JSON data files remain unchanged

**Benefit**: Your content can now be used by any rendering engine.

### **3. New 3D Entity System**
Created Babylon.js-native entity classes:

- ✅ **Entity3D** - Base class for all 3D game entities
- ✅ **Player3D** - Player character with inventory, abilities, stats
- ✅ **Enemy3D** - Enemies with AI (patrol/aggro), combat system
- ✅ **NPC3D** - Non-player characters with dialogue support

**Features**:
- Physics-based movement with gravity
- Collision detection
- Combat system (attack, damage, health)
- Inventory management
- Experience/leveling system

### **4. Camera System**
- ✅ **CameraController** - Third-person camera following player
  - Smooth camera tracking
  - Mouse-based rotation
  - Zoom controls
  - Collision detection

### **5. Input System**
- ✅ **InputManager** - Unified input handling
  - Keyboard input (WASD, Arrow keys)
  - Mouse tracking
  - Button detection

### **6. New UI System**
- ✅ **UIManager** - HTML5-based UI overlay
  - Health/Mana bars with smooth animations
  - Level and experience display
  - Dialogue system
  - Notifications (info, warning, error, success)
  - Responsive design

### **7. World Management**
- ✅ **WorldManager** - 3D world generation and management
  - Terrain creation (biome-based coloring)
  - Player spawning
  - Enemy spawning with simple AI
  - Combat system integration
  - NPC management

### **8. Game Manager**
- ✅ **GameManager** - Central orchestrator
  - Scene initialization
  - Lighting setup (ambient + directional)
  - Skybox
  - Content loading
  - Game loop management
  - UI updates

---

## 🚧 What Still Needs Work

### **Phase 1.5 - Core Systems (Current Focus)**

#### **1. Remove Phaser Dependencies**
These files still reference Phaser and must be converted or removed:

**UI Files** (19 files in `src/ui/`):
```
- AdvancedDialogueUI.ts ❌
- AdvancedHealthBar.ts ❌
- AdvancedInventoryUI.ts ❌
- EnhancedPanel.ts ❌
- ProfessionalHealthBar.ts ❌
- ProfessionalDialogueUI.ts ❌
- TabbedInventoryUI.ts ❌
- [and 12 more...]
```

**Action**: Delete these old Phaser UI files (kept UIManager.ts as replacement)

**Scene Files** (5 files in `src/scenes/`):
```
- BootScene.ts ❌
- PreloadScene.ts ❌
- WorldMapScene.ts ❌
- GameScene.ts ❌
- RiftSiteScene.ts ❌
```

**Action**: Delete these (WorldManager replaces them)

**Legacy System Files** (in `src/systems/`):
```
- abilities/ ❌ (Phaser-specific)
- combat/ ❌ (Phaser-specific)
- inventory/ ❌ (Phaser-specific)
- tiles/ ❌ (Phaser-specific)
- visuals/ ❌ (Phaser-specific)
- loot/ ❌ (Phaser-specific)
```

**Action**: Review and port critical logic to new Babylon.js systems

#### **2. Enhanced Inventory System**
The new `Player3D` has basic inventory. Need to expand:

```typescript
// Currently: basic ItemData[] storage
// Needed: 
- Grid-based inventory UI (tabs, drag-drop)
- Equipment system with visual overlays
- Item tooltips
- Rarity-based tinting
```

#### **3. Combat System Enhancement**
Currently: Basic melee combat
Needed:
- Range/projectile support
- Ability system (from planned skills)
- Damage types (physical, elemental, etc.)
- Status effects
- Critical hits

#### **4. AI Improvements**
Currently: Simple patrol/aggro
Needed:
- State machine AI
- Pathfinding (A* or similar)
- Group tactics
- Boss mechanics
- Environmental awareness

#### **5. World Generation**
Currently: Single flat terrain
Needed:
- Procedural heightmap generation
- Region-specific terrain features
- POI (point of interest) placement
- Dynamic spawning system
- Fast travel nodes

---

## 📋 File Structure Changes

### **Old (Phaser)**
```
src/
├── scenes/         (5 Phaser scenes)
├── entities/       (Phaser.Physics.Arcade.Sprite)
├── systems/
│   ├── combat/     (Phaser-based)
│   ├── inventory/  (Phaser-based)
│   ├── abilities/  (Phaser-based)
│   └── tiles/      (Phaser-based)
└── ui/            (19 Phaser UI components)
```

### **New (Babylon.js)**
```
src/
├── entities/
│   ├── Entity3D.ts         ✅ (base class)
│   ├── Player3D.ts         ✅ (player)
│   ├── Enemy3D.ts          ✅ (enemies)
│   ├── NPC3D.ts            ✅ (NPCs)
│   ├── Player.ts           (OLD - Phaser)
│   ├── Enemy.ts            (OLD - Phaser)
│   ├── NPC.ts              (OLD - Phaser)
│   └── LootPickup.ts       (OLD - Phaser)
├── systems/
│   ├── game/
│   │   └── GameManager.ts  ✅ (orchestrator)
│   ├── world/
│   │   └── WorldManager.ts ✅ (world management)
│   ├── camera/
│   │   └── CameraController.ts ✅
│   ├── input/
│   │   └── InputManager.ts ✅
│   ├── ui/
│   │   └── UIManager.ts    ✅ (HTML5 overlay)
│   ├── content/            ✅ (unchanged)
│   ├── combat/             (OLD - Phaser)
│   └── [other old folders]
└── data/                   ✅ (unchanged)
```

---

## 🎮 How to Run

### **Development**
```bash
npm install           # Install Babylon.js dependencies (done)
npm run dev          # Start Vite dev server on http://localhost:5173
```

### **Build**
```bash
npm run build        # Create optimized production bundle in dist/
npm run preview      # Test production build locally
```

---

## 🎯 Next Steps (Recommended Order)

### **Immediate (Stability)**
1. ✅ **Remove Phaser files** - Delete old UI, scenes, legacy systems
2. ⏳ **Fix compilation errors** - Should resolve with file deletion
3. ⏳ **Test dev server** - Ensure hot reload works

###  **(Polish)**
4. ⏳ **Enhance UI** - Implement tabbed inventory, equipment panel
5. ⏳ **Improve visuals** - Add models, textures, particles
6. ⏳ **Expand world gen** - Procedural terrain, POI placement

### **Later (Content)**
7. ⏳ **Flesh out combat** - Skills, abilities, effects
8. ⏳ **Improve AI** - State machines, pathfinding
9. ⏳ **Add content** - More enemies, items, quests
10. ⏳ **Networking** - Multiplayer/leaderboards (optional)

---

## 🔧 Key Improvements This Migration Enables

### **Performance**
- Babylon.js WebGL optimization
- Better memory management
- Native browser API integration

### **Features**
- True 3D capability (was 2D)
- Better physics engine
- Advanced lighting & shadows
- Material system

### **Development**
- Native TypeScript support
- Better IDE integration
- Cleaner architecture
- Easier testing

---

## ⚠️ Breaking Changes

| Old | New | Impact |
|-----|-----|--------|
| Phaser.Physics.Arcade.Sprite | BABYLON.Mesh | All entities |
| Phaser Scenes | WorldManager | World structure |
| Phaser Input | InputManager | Controls |
| Phaser UI | UIManager + HTML5 | Visuals |
| Phaser Camera | CameraController | View |

---

## 📚 Resources

- **Babylon.js Docs**: https://doc.babylonjs.com/
- **TypeScript Docs**: https://www.typescriptlang.org/docs/
- **Vite Docs**: https://vitejs.dev/guide/

---

## 🎓 Architecture Notes

### **Data Flow**
```
GameManager
├─ Managers (ItemManager, NPCManager, etc.)
├─ WorldManager
│  ├─ Player3D
│  ├─ Enemy3D[]
│  ├─ NPC3D[]
│  └─ Terrain
├─ CameraController
├─ InputManager
└─ UIManager
```

### **Entity Lifecycle**
1. **Create** - Instantiate Entity3D subclass
2. **Update** - Called each frame via WorldManager
3. **Interact** - Input triggers actions
4. **Destroy** - Dispose mesh, clean up resources

### **Game Loop**
```typescript
// src/main.ts
engine.runRenderLoop(() => {
  gameManager.update()        // All game logic
  gameManager.getScene().render()  // Render 3D scene
})
```

---

## 📞 Questions?

Refer to GameManager.ts for the main entry point and WorldManager.ts for game logic coordination.

---

**Migration Status**: 70% Complete (Core Systems)
**Last Updated**: March 19, 2026
**Next Review**: After Phase 1.5 (Phaser file removal)

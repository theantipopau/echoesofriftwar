# Quest Testing & Feature Validation Guide

## Dispatch Turn-In Flow (PHASE 9)
Complete this sequence to test the main progression system:

### Setup
1. Start new game → spawn in Crydee
2. Complete intro quests (Rift Rumor, Guardians Help, Forest Clear)
3. Travel to Warfront Approach
4. Accept "Mud and Iron" from Captain Rennic
5. Accept "Signals for Krondor" from Scout Tavia
6. Accept "Under the War Road" (Culvert Breach) from Captain Rennic

### Culvert Breach Quest Flow
1. Navigate to Culvert Breach POI
2. Trigger special encounter → enter dungeon
3. Clear encounters systematically:
   - Breach Entry room
   - Maintenance Run (seep passage)
   - Seep Gallery
   - Rift Heart room (final boss: Culvert Overseer)
4. Defeat Culvert Overseer
5. Reach dispatch cache interactable
6. Exit dungeon (auto-triggered after cache or boss clear)
7. **CHECKPOINT**: Player should have `krondor_dispatches` in inventory

### Dispatch Turn-In (World State Trigger)
1. Return to Captain Rennic at Warfront
2. Select dialogue: "Hand over the Krondor dispatches"
3. **VERIFY**: Items consumed, actions execute in order:
   - `krondor_dispatches` removed from inventory
   - World state tags: `warfront_culvert_stabilized`, `route_krondor_secured` SET
   - Talk objective `captain_rennic_return` completed
4. Proceed through dialogue tree: `dispatch_turnin` → `secured_briefing` → end
5. **CHECKPOINT**: Route to Outer Roads now accessible

### World State Consequences (Visual & NPC Changes)
1. **Warfront should now show**:
   - Additional map position with new NPCs:
     - Relay Engineer Ves (near supply stack)
     - Roadwarden Hal (rear of camp)
     - Quartermaster Sella (supply area) — already visible
   - Extra props:
     - Supply crate stacks
     - Signal cart
     - Relay beacon post
     - Victory banner
     - Brazier fire pit
2. **Route panel should display**:
   - Outer Roads to Krondor: now "Route secured" (playable)
   - Transition point added: Krondor Milestone → Outer Roads to Krondor

### Outer Roads Region Testing
1. Travel to Outer Roads to Krondor via Krondor Milestone POI
2. **Initial spawn**: Should be at merchant post area (x: 100, y: 280)
3. **NPCs should appear**:
   - Veteran Kess (merchant escort questgiver)
   - Merchant Aldric (merchant)
4. **Available quests**:
   - "The Outer Road Opens" (from Veteran Kess)
5. Accept and begin Outer Roads Patrol quest

### Outer Roads Patrol Quest
1. Visit Krondor Merchant Post POI
2. Defeat 2 Siege Hounds near post
3. Investigate Caravan Wreckage POI
4. Defeat 2 War Wretches at caravan
5. Reach Eastern Passage POI
6. Talk to Veteran Kess (return objective)
7. **REWARD**: `roadwarden_relay` item
8. **TRIGGER**: World state tag `outer_roads_secured` should be set (if NPC action implemented)

### Rift Ritual Quest (Cascading Event)
1. From Dispatcher Galt at Outer Roads (appeared after `route_krondor_secured`)
2. Accept "The Inner Nexus" quest
3. Navigate to Inner Rift Nexus POI
4. Defeat Rift Harbinger (high-difficulty elite enemy)
5. Return to Dispatcher Galt
6. Complete dialogue: "ritual_complete" branch
7. **CONSEQUENCE**: World state tag `rift_ritual_sealed` set
8. New dialogue becomes available for Dispatcher Galt

## Expected Test Results

### Pass Criteria
- ✅ Dispatch turn-in completes without errors
- ✅ World state tags set correctly (verify via NPC dialogue branches)
- ✅ Route unlock is reflected in UI (Route secured status)
- ✅ New NPCs appear in Warfront after state change
- ✅ All new quests are available and trackable
- ✅ Outer Roads enemies scale appropriately (level 4-5 difficulty)
- ✅ Rift Harbinger boss encounter is challenging but beatable
- ✅ All consequence chains execute without UI errors

### Known Limitations (For Next Phase)
- [ ] Training system not yet implemented (NPC prompts: "Training will arrive with next combat pass")
- [ ] Shop interface not yet implemented (uses placeholder message)
- [ ] Inland territories beyond Eastern Passage have no playable content yet
- [ ] Ambient NPC dialogue/barks not yet implemented
- [ ] Save/load system for progression persistence

## Manual Test Checklist

### Dispatch Flow
- [ ] Culvert Overseer drops dispatches
- [ ] Player inventory shows `krondor_dispatches`
- [ ] Turn-in dialogue option appears for Captain Rennic
- [ ] Actions execute in correct order (item consumed, world state set, quest complete)
- [ ] "Secured briefing" dialogue plays after turn-in
- [ ] Quest completes with success notification

### Route Unlock
- [ ] UI route card shows "Route secured" for Outer Roads
- [ ] Transition point appears in Warfront from Krondor Milestone
- [ ] Travel succeeds without "Route locked" message
- [ ] Player spawns correctly in Outer Roads

### NPC & Prop Spawning
- [ ] Warfront has 3 new NPCs visible
- [ ] State variant props are placed correctly
- [ ] No duplicate NPCs or props on repeated visits
- [ ] NPC dialogue branches correctly based on world state

### Quest Progression
- [ ] Outer Roads quests are trackable in journal
- [ ] Objectives update as player completes them
- [ ] Rewards are granted on quest completion
- [ ] Dispatcher Galt offers Rift Ritual quest

### Combat & Enemies
- [ ] Outer Roads enemies spawn in correct locations
- [ ] Rift Harbinger is difficult but not impossible to defeat
- [ ] Loot tables drop expected items
- [ ] No combat system regressions from previous builds

## Debugging Notes

If tests fail:

**Dispatch not consumed:**
- Check WorldManager dialogue action parsing for `consumeItem:` prefix
- Verify Player3D.removeFromInventory() is implemented
- Check NPC dialogue action array in npcs.json

**World state tags not set:**
- Verify RegionProgression.setWorldStateTag() is called
- Check dialogue action parsing for `setWorldState:` prefix
- Confirm action order in npcs.json (must be before `talk:`)

**Route not unlocking:**
- Verify RegionProgression.evaluateUnlocks() is called after state change
- Check regions.json unlock requirements match state tags
- Ensure UI route display checks `playable` field

**NPCs not appearing:**
- Verify NPC conditionalStartNodes or requiredWorldStateTags
- Check region.npcPool includes new NPC IDs
- Confirm stateVariants.additionalNpcIds are properly defined

## Next Phase Targets

1. **Equipment system** — player stats affected by gear
2. **Training/leveling** — experience → stat scaling
3. **Fast travel** — unlock regions as fast travel nodes
4. **Save/load** — persist player progression across sessions
5. **Further inland expansion** — new regions, escalating difficulty

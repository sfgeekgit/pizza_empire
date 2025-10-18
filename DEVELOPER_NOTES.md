# Pizza Delivery Game - Developer Notes

## Overview
This is an incremental/idle game built with the Profectus framework where players run a pizza delivery business. The goal is to reach $1,000,000 by accepting delivery jobs, unlocking pizza types, and hiring drivers.

## Project Structure

### Key Files Created/Modified

```
/home/pizza/game/
├── src/
│   ├── data/
│   │   ├── layers/
│   │   │   └── main.tsx          # Main game layer (NEW - all game logic)
│   │   ├── projInfo.json         # Game metadata (MODIFIED)
│   │   ├── projInfo.ts           # TypeScript version (CREATED but not used)
│   │   ├── layers.tsx            # Layer registry (MODIFIED)
│   │   └── projEntry.tsx         # Entry point (HEAVILY MODIFIED)
│   ├── components/
│   │   ├── Nav.vue               # Sidebar navigation (DISABLED)
│   │   └── Game.vue              # Main game component (MODIFIED)
│   └── App.vue                   # Root app component (MODIFIED)
```

---

## Framework Modifications

### 1. Removed Sidebar Navigation
**Files Modified:** `App.vue`, `Game.vue`

**Changes:**
- Commented out/removed `import Nav from "./components/Nav.vue"`
- Removed `<Nav />` component usage in both files

**Why:** Client wanted a cleaner, full-width interface without default Profectus navigation.

---

### 2. projEntry.tsx - Simplified Entry Point
**File:** `src/data/projEntry.tsx`

**Original Issues:**
- Had demo "prestige" layer and complex tree structure
- Created its own "main" layer with just points counter
- Had tree/reset mechanics we didn't need

**Changes Made:**
1. Removed the entire demo `main` layer definition (was ~70 lines)
2. Removed all references to `prestige` layer
3. Changed `createLayerTreeNode` to `createTreeNode` (API change)
4. Removed tree reset logic
5. Simplified to just import and register our custom main layer:

```typescript
import main from "./layers/main";

export const getInitialLayers = (player: Partial<Player>): Array<Layer> => [main];
```

---

### 3. Profectus Version Compatibility Notes

**Version:** Latest from GitHub (commit `d69197d`)

**API Differences from Documentation:**
- No `buyables` or `upgrades` as separate feature folders
- Buyables are now called **Repeatables** (`features/clickables/repeatable.tsx`)
- Upgrades exist in `features/clickables/upgrade.tsx`
- Tree nodes use `createTreeNode` not `createLayerTreeNode`

**Why We Used Clickables Instead:**
- Repeatables have complex currency/requirement API that was causing errors
- Clickables are simpler, more flexible, and work reliably
- Gives us full control over cost calculations and purchase logic

---

## Game Implementation (main.tsx)

### Architecture Overview

The game is a single-layer implementation using:
- **Resources:** Money (tracked with Decimal for big numbers)
- **Clickables:** Shop items (hire drivers, unlock pizzas)
- **Refs:** Game state (jobs, drivers, unlocked pizzas)
- **Update Loop:** GlobalBus event for timers and deliveries

### Key Components

#### 1. Resources
```typescript
const money = createResource<DecimalSource>(10, "dollars");
const best = trackBest(money);    // Tracks highest money reached
const total = trackTotal(money);   // Tracks total money earned
```

#### 2. Persistent State (Must be in return statement!)
```typescript
const unlockedPizzas: Ref<string[]> = ref(["Cheese"]);
const totalDrivers: Ref<number> = ref(1);
const jobQueue: Ref<DeliveryJob[]> = ref([]);
const activeDeliveries: Ref<ActiveDelivery[]> = ref([]);
const nextJobId = ref(0);
const timeSinceLastJob = ref(0);
```

**CRITICAL:** All refs must be included in the layer's return statement or you'll get persistence errors!

#### 3. Game Loop
```typescript
globalBus.on("update", diff => {
    // Update active deliveries (countdown timers)
    // Generate new jobs every 60 seconds
    // Spawn initial jobs on first load
});
```

The `diff` parameter is time in seconds since last update.

#### 4. Shop System (Clickables)

All shop items use the clickable API:
```typescript
const itemClickable = createClickable(() => ({
    display: {
        title: "Item Name",
        description: () => `Dynamic text here`  // Use function for reactive values
    },
    canClick: () => Decimal.gte(money.value, cost),  // Enable/disable logic
    onClick() {
        money.value = Decimal.sub(money.value, cost);
        // Apply purchase effect
    },
    visibility: () => someCondition,  // Optional: hide when not relevant
    style: { /* CSS */ }
}));
```

**Important:** Driver costs scale using `Decimal.pow(1.5, totalDrivers.value).times(100)`

#### 5. Job System

**Job Generation:**
- Random pizza type (weighted toward unlocked types)
- Random duration (10-60 seconds)
- Payout scales with pizza complexity (multiplier based on pizza index)

**Job Acceptance:**
- Requires: available driver + unlocked pizza type
- Moves job from queue to active deliveries
- Occupies one driver for the duration

**Job Completion:**
- Timer counts down in update loop
- Money added when timer reaches 0
- Driver becomes available again

### Data Structures

```typescript
interface DeliveryJob {
    id: number;
    duration: number;        // seconds
    pizzaType: string;
    payout: DecimalSource;
}

interface ActiveDelivery extends DeliveryJob {
    timeRemaining: number;   // countdown
    driverId: number;        // which driver is handling it
}
```

---

## Game Balance

### Starting Conditions
- Money: $10
- Drivers: 1
- Unlocked Pizzas: Cheese only

### Pizza Unlock Costs
```
Pepperoni:    $50
Supreme:      $150
Hawaiian:     $400
Meat Lovers:  $1000
```

### Driver Costs (Exponential)
```
Driver 2: $100
Driver 3: $150
Driver 4: $225
Driver 5: $337
etc. (1.5x multiplier each time)
```

### Job Generation
- New job every 60 seconds
- 3 jobs spawn on game start
- Payout: $10-50 base × pizza multiplier (1-5)

### Win Condition
Reach $1,000,000

---

## Common Issues & Solutions

### 1. "Persistent ref not registered" Error
**Solution:** Add the ref to the layer's return statement.

### 2. Import Errors (module not found)
**Check:** This Profectus version's API. Use `ls -la src/features/` to see what exists.
- Use `createTreeNode` not `createLayerTreeNode`
- Import from `features/clickables/repeatable` not `features/buyables/buyable`

### 3. Currency Duplication Warning
**Solution:** Wrap shared resources with `noPersist()`:
```typescript
currency: noPersist(money)
```

### 4. Blank Page / No Game Visible
**Causes:**
- `projEntry.tsx` creating its own main layer (remove it!)
- Other layers (like prestige) in layers folder (delete them)
- `layers.tsx` not importing your main layer correctly

---

## Extending the Game

### Adding New Pizza Types
1. Add to `PIZZA_TYPES` array
2. Add cost to costs array in `pizzaUnlockClickables`
3. Job generation will automatically include it

### Adding New Features

**Example: Automation**
```typescript
const autoAcceptClickable = createClickable(() => ({
    display: {
        title: "Auto-Accept Cheese Jobs",
        description: "Cost: $5000"
    },
    canClick: () => Decimal.gte(money.value, 5000),
    onClick() {
        money.value = Decimal.sub(money.value, 5000);
        autoAcceptCheese.value = true;
    }
}));

// In update loop:
if (autoAcceptCheese.value && availableDrivers.value > 0) {
    const cheeseJobs = jobQueue.value.filter(j => j.pizzaType === "Cheese");
    if (cheeseJobs.length > 0) acceptJob(cheeseJobs[0]);
}
```

**Remember:** Add new refs to the return statement!

### Adding Prestige/Reset Layers

To add a second layer:
1. Create `src/data/layers/prestige.tsx`
2. Import it in `layers.tsx`
3. Add to `getInitialLayers` in `projEntry.tsx`
4. Use `createTreeNode` to link layers visually
5. Implement reset logic using `createReset` from `features/reset.ts`

---

## Development Tips

### Hot Reload
The dev server (`npm run dev -- --host`) supports hot reload. Changes to `.tsx` files update instantly in browser.

### Console Debugging
All game state is reactive. In browser console:
```javascript
// Access layer state
player.layers.main.money
player.layers.main.totalDrivers

// Modify for testing
player.layers.main.money.value = 999999
```

### Save System
Profectus auto-saves to localStorage every few seconds. Saves persist across refreshes.

To reset: Settings icon → Saves → Delete save

### TypeScript Errors
If you see TS errors but game works, it's usually safe to ignore during prototyping. Run `npm run build` before production to catch real issues.

---

## Deployment

### Build for Production
```bash
npm run build
```

Output goes to `dist/` folder. Serve with any static file server.

### Environment Notes
- Game runs entirely client-side (no backend needed)
- Uses localStorage for saves
- Works on mobile browsers
- No external dependencies required at runtime

---

## File Sizes & Performance

### Current Build
- Main layer: ~300 lines
- Total game logic: < 10KB minified
- Profectus framework: ~200KB

### Performance Characteristics
- Update loop runs at 20 TPS (configurable)
- Handles 100+ active jobs/deliveries easily
- No known lag issues

---

## Questions or Issues?

### Check These First
1. Browser console for errors
2. `projEntry.tsx` - is only our main layer loaded?
3. Return statement in `main.tsx` - are all refs included?
4. Profectus version - check `git log` and API docs

### Useful Commands
```bash
# Check what's in features folder
ls -la src/features/

# Find where something is used
grep -ril "searchterm" src/

# See recent changes
git log --oneline -10

# Clean rebuild
rm -rf node_modules dist .vite
npm install
npm run dev
```

---

## Credits
- Framework: Profectus (https://github.com/profectus-engine/Profectus)
- Game Design: Based on incremental pizza delivery concept
- Built: October 2025

---

**Last Updated:** October 17, 2025

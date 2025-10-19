# Pizza Delivery Game - Developer Notes

## Overview
This is an incremental/idle game built with the Profectus framework where players run a pizza delivery business. The game features a narrative story system with an intro chapter and 4 progressive chapters that unfold as you reach money milestones. Players accept delivery jobs, unlock pizza types, hire drivers with unique names, and make story choices that provide gameplay bonuses. The goal is to reach $10,000 (currently set low for development/testing).

## Project Structure

### Key Files Created/Modified

```
/home/pizza/game/
├── src/
│   ├── data/
│   │   ├── layers/
│   │   │   ├── main.tsx          # Main game layer (all game logic)
│   │   │   ├── intro.tsx         # Intro story chapter
│   │   │   ├── chapter1.tsx      # Chapter 1 story ($101 milestone)
│   │   │   ├── chapter2.tsx      # Chapter 2 story ($1000 milestone)
│   │   │   ├── chapter3.tsx      # Chapter 3 story ($2000 milestone)
│   │   │   └── chapter4.tsx      # Chapter 4 story ($3000 milestone)
│   │   ├── gameConfig.ts         # Centralized game balance configuration
│   │   ├── projInfo.json         # Game metadata (MODIFIED)
│   │   ├── layers.tsx            # Layer registry (MODIFIED)
│   │   └── projEntry.tsx         # Entry point (HEAVILY MODIFIED)
│   ├── components/
│   │   ├── Nav.vue               # Sidebar navigation (DISABLED)
│   │   ├── Game.vue              # Main game component (MODIFIED)
│   │   └── Options.vue           # Settings modal (INTEGRATED)
│   └── App.vue                   # Root app component (MODIFIED)
├── GAMEPLAY.md                   # User-facing gameplay description
└── DEVELOPER_NOTES.md            # This file
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
import intro from "./layers/intro";
import chapter1 from "./layers/chapter1";
import chapter2 from "./layers/chapter2";
import chapter3 from "./layers/chapter3";
import chapter4 from "./layers/chapter4";

export const getInitialLayers = (player: Partial<Player>): Array<Layer> =>
    [intro, main, chapter1, chapter2, chapter3, chapter4];
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

## Game Configuration (gameConfig.ts)

All game balance settings are centralized in `src/data/gameConfig.ts` for easy tuning:

```typescript
export const G_CONF = {
    // Win condition
    WIN_AMOUNT: 10000,  // $10,000 (dev mode - production would be 1,000,000)

    // Starting resources
    STARTING_MONEY: 10,
    STARTING_DRIVERS: 1,
    STARTING_PIZZAS: ["Cheese"],

    // Chapter triggers
    CHAPTER_1_TRIGGER: 101,
    CHAPTER_2_TRIGGER: 1000,
    CHAPTER_3_TRIGGER: 2000,
    CHAPTER_4_TRIGGER: 3000,

    // Job generation
    JOB_GENERATION_INTERVAL: 3,  // Seconds between new job checks
    AUTO_JOB_LIMIT: 4,           // Only generate if <= this many in queue

    // Pizza unlock costs
    PIZZA_UNLOCK_COSTS: {
        Pepperoni: 50,
        Supreme: 150,
        Hawaiian: 400,
        "Meat Lovers": 1000
    },

    // Driver costs (exponential)
    DRIVER_BASE_COST: 20,
    DRIVER_COST_MULTIPLIER: 1.5,

    // Chapter bonuses
    CHAPTER_1_QUALITY_BONUS: 50,  // +50% earnings
    CHAPTER_1_SPEED_BONUS: 20,    // -20% delivery time
} as const;
```

Import with: `import { G_CONF } from "./gameConfig";`

---

## Story System

### Chapter Layers

The game features 5 story layers that trigger at money milestones:

1. **Intro** - Plays on game start, offers choice:
   - Extra driver (immediate boost)
   - Unlock Pepperoni pizza (access to better jobs)

2. **Chapter 1** ($101) - Tony's competition begins, choice:
   - Quality Focus: +50% earnings on all jobs
   - Speed Focus: -20% delivery time on all jobs

3. **Chapter 2** ($1000) - Partnership with Tony, community focus

4. **Chapter 3** ($2000) - Facing corporate chains together

5. **Chapter 4** ($3000) - Mentoring other local businesses

Each chapter uses `createTabFamily()` to display story content and choices. Story choices are persisted and provide permanent gameplay bonuses.

---

## Game Implementation (main.tsx)

### Architecture Overview

The main layer implements:
- **Resources:** Money (tracked with Decimal for big numbers)
- **Clickables:** Shop items (hire drivers, unlock pizzas)
- **Refs:** Game state (jobs, drivers array, unlocked pizzas)
- **Update Loop:** GlobalBus event for timers, deliveries, and job generation
- **Driver System:** Unique named drivers with FIFO queue rotation

### Key Components

#### 1. Resources
```typescript
const money = createResource<DecimalSource>(10, "dollars");
const best = trackBest(money);    // Tracks highest money reached
const total = trackTotal(money);   // Tracks total money earned
```

#### 2. Persistent State (Must be in return statement!)
```typescript
const unlockedPizzas: Ref<string[]> = ref(G_CONF.STARTING_PIZZAS);
const drivers: Ref<Driver[]> = ref([]);  // Array of Driver objects
const jobQueue: Ref<DeliveryJob[]> = ref([]);
const activeDeliveries: Ref<ActiveDelivery[]> = ref([]);
const nextJobId = ref(0);
const nextDriverId = ref(1);  // For generating unique driver IDs
const timeSinceLastJob = ref(0);
const initialJobsSpawned = ref(false);
const driversInitialized = ref(false);
const introComplete = ref(false);
const introChoice = ref<string | null>(null);
const chapter1Choice = ref<string | null>(null);
```

**CRITICAL:** All refs must be included in the layer's return statement or you'll get persistence errors!

**Note on Driver System:** We use a `drivers` array instead of a simple count. Each driver has unique properties and the system rotates through available drivers in FIFO order.

#### 3. Game Loop
```typescript
globalBus.on("update", diff => {
    // Update active deliveries (countdown timers)
    // Complete deliveries and mark drivers available
    // Generate new jobs every 3 seconds if <= AUTO_JOB_LIMIT
    // Spawn initial jobs on first load
});
```

The `diff` parameter is time in seconds since last update. Job generation uses `timeSinceLastJob` to track intervals.

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

**Important:** Driver costs scale using `Decimal.pow(G_CONF.DRIVER_COST_MULTIPLIER, drivers.value.length).times(G_CONF.DRIVER_BASE_COST)`

#### 5. Driver System

**Driver Data Structure:**
```typescript
interface Driver {
    id: number;              // Unique ID (from nextDriverId)
    name: string;            // Random name from 50-name pool
    status: "available" | "busy";
    lastAvailableTime: number;  // Timestamp for FIFO queue rotation
}
```

**Driver Names:** 50 unique names randomly selected on creation:
```typescript
const DRIVER_NAMES = [
    "Alex", "Jordan", "Casey", "Morgan", "Taylor",
    "Riley", "Sam", "Avery", "Quinn", "Charlie",
    // ... 40 more names
];
```

**Available Driver Logic:**
```typescript
const availableDrivers = computed(() => {
    const busyDriverIds = new Set(activeDeliveries.value.map(d => d.driverId));
    return drivers.value
        .filter(d => !busyDriverIds.has(d.id))
        .sort((a, b) => a.lastAvailableTime - b.lastAvailableTime);
});
```

**Key Insight:** We check `activeDeliveries` array instead of `driver.status` field because Vue reactivity can be unreliable with nested object updates. This prevents the bug where multiple jobs could be assigned to the same driver.

**Driver Queue Rotation:** When assigning a job, we always take the first driver from `availableDrivers` (sorted by `lastAvailableTime`). When a delivery completes, we update the driver's `lastAvailableTime` to `Date.now()`, moving them to the back of the queue.

#### 6. Job System

**Job Generation:**
- Random pizza type (weighted toward unlocked types)
- Random duration (`JOB_DURATION_MIN` to `JOB_DURATION_MAX`)
- Payout scales with pizza complexity (multiplier based on pizza index)
- Modified by chapter bonuses (quality/speed choices)

**Job Acceptance:**
- Requires: available driver + unlocked pizza type
- Moves job from queue to active deliveries
- Assigns to next driver in FIFO queue
- Updates driver's `lastAvailableTime`

**Job Completion:**
- Timer counts down in update loop
- Money added when timer reaches 0
- Driver marked available by updating `lastAvailableTime`

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

interface Driver {
    id: number;
    name: string;
    status: "available" | "busy";
    lastAvailableTime: number;
}
```

---

## Game Balance

**Note:** All values configured in `gameConfig.ts` (G_CONF object)

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
Driver 2: $20
Driver 3: $30
Driver 4: $45
Driver 5: $67
etc. (1.5x multiplier: base_cost × 1.5^(drivers_owned))
```

### Job Generation
- New job every 3 seconds (fast for dev/testing)
- Only generates if ≤ 4 jobs in queue (AUTO_JOB_LIMIT)
- 3 jobs spawn on game start
- Duration: 10-30 seconds
- Payout: $10-50 base × pizza multiplier

### Chapter Bonuses
- **Quality Focus (Ch1):** +50% earnings on all jobs
- **Speed Focus (Ch1):** -20% delivery time on all jobs

### Win Condition
Currently: $10,000 (for development/testing)
Production: $1,000,000

---

## Critical Bugs Solved

### 1. Driver ID Duplication Bug

**Symptom:** When starting with intro bonus driver or hiring a 3rd driver, multiple drivers would have the same ID, causing only one to be usable.

**Root Cause:** Profectus persistence timing. When using `nextDriverId.value++`, the increment would happen, but then localStorage would load and reset it back before the next driver was created.

**Failed Solutions:**
- Using post-increment operator (`nextDriverId.value++`) - doesn't trigger persistence properly
- Creating drivers immediately on layer initialization - happens before persistence loads

**Working Solution:**
```typescript
// 1. Use explicit assignment to trigger persistence
function createDriver(): Driver {
    const driverId = nextDriverId.value;
    nextDriverId.value = nextDriverId.value + 1;  // NOT nextDriverId.value++
    return {
        id: driverId,
        name: generateDriverName(),
        status: "available",
        lastAvailableTime: Date.now()
    };
}

// 2. Initialize drivers in watch() with immediate: true
// This ensures it happens AFTER persistence loads
watch([introComplete, introChoice], ([complete, choice]) => {
    if (!driversInitialized.value) {
        const newDrivers = [];
        for (let i = 0; i < G_CONF.STARTING_DRIVERS; i++) {
            newDrivers.push(createDriver());
        }
        drivers.value = newDrivers;
        driversInitialized.value = true;
    }
    // ... handle intro bonus
}, { immediate: true });
```

### 2. Multiple Jobs to Same Driver Bug

**Symptom:** Could assign unlimited jobs to the same driver, even though they should only handle one at a time.

**Root Cause:** Relying on `driver.status` field didn't trigger Vue reactivity properly when checking available drivers.

**Solution:** Check the `activeDeliveries` array instead:
```typescript
const availableDrivers = computed(() => {
    const busyDriverIds = new Set(activeDeliveries.value.map(d => d.driverId));
    return drivers.value
        .filter(d => !busyDriverIds.has(d.id))  // Check activeDeliveries, not status
        .sort((a, b) => a.lastAvailableTime - b.lastAvailableTime);
});
```

### 3. Array Mutation Not Triggering Reactivity

**Symptom:** When hiring a driver with `drivers.value.push(newDriver)`, the UI wouldn't update properly.

**Root Cause:** Vue 3 reactivity on arrays works better with reassignment than mutation for persistent refs in Profectus.

**Solution:** Use array spreading to create new array:
```typescript
// BAD - direct mutation
drivers.value.push(newDriver);

// GOOD - array reassignment
drivers.value = [...drivers.value, newDriver];
```

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

### 5. Settings Modal Integration
**Location:** Gear icon in bottom-left corner
**Features:**
- Reset save functionality (hard reset)
- Integrated with existing Options.vue component
- Commented out appearance settings (not needed for this game)

---

## Vue Reactivity Patterns in Profectus

### General Guidelines

1. **Array Updates:** Use reassignment, not mutation
   ```typescript
   // BAD
   myArray.value.push(item);
   myArray.value[0].field = newValue;

   // GOOD
   myArray.value = [...myArray.value, item];
   myArray.value = myArray.value.map((item, i) =>
       i === 0 ? { ...item, field: newValue } : item
   );
   ```

2. **Persistent Ref Increments:** Use explicit assignment
   ```typescript
   // BAD - doesn't always trigger persistence
   counter.value++;

   // GOOD - always persists
   counter.value = counter.value + 1;
   ```

3. **Initialization Timing:** Use watch() with immediate: true for refs that depend on persistence
   ```typescript
   // BAD - runs before persistence loads
   if (drivers.value.length === 0) {
       drivers.value = [createDriver()];
   }

   // GOOD - runs after persistence loads
   watch(someRef, () => {
       if (!initialized.value) {
           drivers.value = [createDriver()];
           initialized.value = true;
       }
   }, { immediate: true });
   ```

4. **Checking Availability:** Use arrays as source of truth, not nested object properties
   ```typescript
   // BAD - nested updates may not trigger reactivity
   const available = drivers.value.filter(d => d.status === "available");

   // GOOD - check against array that's definitely reactive
   const busyIds = new Set(activeDeliveries.value.map(d => d.driverId));
   const available = drivers.value.filter(d => !busyIds.has(d.id));
   ```

---

## Extending the Game

### Adding New Pizza Types
1. Add to `G_CONF.PIZZA_TYPES` array in `gameConfig.ts`
2. Add cost to `G_CONF.PIZZA_UNLOCK_COSTS` object
3. Job generation will automatically include it (weighted by unlock status)

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

### Adding New Story Chapters

To add a new chapter:
1. Create `src/data/layers/chapter5.tsx`
2. Use `createTabFamily()` for story content structure
3. Import it in `layers.tsx` and `projEntry.tsx`
4. Set visibility trigger based on money milestone:
   ```typescript
   visibility: () => Decimal.gte(main.money.value, G_CONF.CHAPTER_5_TRIGGER)
   ```
5. Add persistent refs for choices: `const chapter5Choice = ref<string | null>(null);`
6. Apply bonuses in main layer based on choice

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

To reset: Settings gear icon (bottom-left) → Hard Reset

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
- Game Design: sfgeekgit
- Built: October 2025

---

**Last Updated:** October 18, 2025

---

## Quick Reference

### Key Files
- `gameConfig.ts` - All balance values (G_CONF object)
- `main.tsx` - Core game logic, driver system, job system
- `intro.tsx` through `chapter4.tsx` - Story layers
- `Options.vue` - Settings modal (gear icon bottom-left)

### Important Patterns
- Array updates: Use `array.value = [...array.value, newItem]`
- Counter increments: Use `counter.value = counter.value + 1`
- Driver availability: Check `activeDeliveries` array, not `status` field
- Initialization: Use `watch()` with `{ immediate: true }` after persistence loads

### Common Gotchas
- Driver ID duplication → Initialize in watch(), use explicit assignment
- Multiple jobs per driver → Check activeDeliveries array for availability
- Array mutation not updating → Use reassignment instead
- Refs not persisting → Must be in layer return statement

/**
 * Game Balance Configuration
 *
 * All game balance settings, progression values, and tuning parameters
 * are centralized here for easy adjustment.
 */

export const G_CONF = {
    // ===== WIN CONDITION =====
    WIN_AMOUNT: 10000, // $1,000,000 to win the game

    // ===== STARTING RESOURCES =====
    STARTING_MONEY: 10,
    STARTING_DRIVERS: 1,
    STARTING_PIZZAS: ["Cheese"],

    // ===== CHAPTER TRIGGERS =====
    CHAPTER_1_TRIGGER: 101, // Trigger at $101
    CHAPTER_2_TRIGGER: 1000, // Trigger at $1,000
    CHAPTER_3_TRIGGER: 2000, // Trigger at $2,000
    CHAPTER_4_TRIGGER: 3000, // Trigger at $3,000

    // ===== JOB GENERATION =====
    JOB_GENERATION_INTERVAL: 3, // Seconds between new job checks (currently fast for dev)
    AUTO_JOB_LIMIT: 4, // Only auto-generate new jobs if <= this many in queue
    INITIAL_JOBS_COUNT: 3, // Number of jobs to spawn on game start

    // ===== JOB PARAMETERS =====
    JOB_DURATION_MIN: 10, // Minimum job duration in seconds
    JOB_DURATION_MAX: 30, // Maximum job duration in seconds (will add to min)
    JOB_PAYOUT_MIN: 10, // Minimum base payout
    JOB_PAYOUT_MAX: 40, // Maximum additional payout (will add to min)

    // ===== PIZZA UNLOCKS =====
    PIZZA_TYPES: ["Cheese", "Pepperoni", "Supreme", "Hawaiian", "Meat Lovers"],
    PIZZA_UNLOCK_COSTS: {
        Pepperoni: 50,
        Supreme: 150,
        Hawaiian: 400,
        "Meat Lovers": 1000
    },

    // ===== DRIVER COSTS =====
    DRIVER_BASE_COST: 20, //100, // Cost of first additional driver (driver #2)
    DRIVER_COST_MULTIPLIER: 1.5, // Each driver costs 1.5x the previous

    // ===== CHAPTER 1 BONUSES =====
    CHAPTER_1_QUALITY_BONUS: 50, // +50% earnings
    CHAPTER_1_SPEED_BONUS: 20, // -20% delivery time

    // ===== INTRO BONUSES =====
    INTRO_BONUS_DRIVERS: 1, // Extra driver from intro choice
    INTRO_BONUS_PIZZA: "Pepperoni" // Pizza unlocked from intro choice
} as const;

// Type export for TypeScript autocomplete
export type GameConfig = typeof G_CONF;

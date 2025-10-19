import { createLayer, layers } from "game/layers";
import { createResource, trackBest, trackTotal } from "features/resources/resource";
import { createClickable } from "features/clickables/clickable";
import { jsx, JSXFunction } from "game/common";
import { createTreeNode } from "features/trees/tree";
import Decimal, { DecimalSource, format } from "util/bignum";
import { render } from "util/vue";
import { computed, ref, Ref, watch } from "vue";
import { globalBus } from "game/events";
import { noPersist } from "game/persistence";
import { persistent } from "game/persistence";
import Options from "components/modals/Options.vue";
import { G_CONF } from "../gameConfig";

// Driver names list
const DRIVER_NAMES = [
    "Alex", "Blake", "Casey", "Drew", "Eli", "Frankie", "Gray", "Harper", "Izzy", "Jordan",
    "Kelly", "Logan", "Morgan", "Nico", "Ollie", "Parker", "Quinn", "Riley", "Sage", "Taylor",
    "Avery", "Bailey", "Cameron", "Dakota", "Emerson", "Finley", "Hayden", "Jamie", "Kendall", "Lane",
    "Marley", "Noel", "Oakley", "Peyton", "Reese", "Rowan", "Sawyer", "Skyler", "Spencer", "Sydney",
    "Tatum", "Tyler", "Val", "Wesley", "Winter", "Yael", "Zion", "River", "Phoenix", "Sage"
];

// Driver interface
interface Driver {
    id: number;
    name: string;
    status: "available" | "busy";
    lastAvailableTime: number;  // Date.now() timestamp
}

// Job interface
interface DeliveryJob {
    id: number;
    duration: number;
    pizzaType: string;
    payout: DecimalSource;
}

// Active delivery interface
interface ActiveDelivery extends DeliveryJob {
    timeRemaining: number;
    driverId: number;
}

const id = "main";
const layer = createLayer(id, function (this: any) {
    const name = "Pizza Delivery";
    const color = "#FFA500";

    // Settings modal ref
    const optionsModal = ref<InstanceType<typeof Options> | null>(null);

    // Resources
    const money = createResource<DecimalSource>(G_CONF.STARTING_MONEY, "dollars");
    const best = trackBest(money);
    const total = trackTotal(money);

    // Persistent state - must be created first
    const nextDriverId = persistent<number>(1);
    const drivers = persistent<Driver[]>([]);

    // Helper function to generate a random driver name
    function generateDriverName(): string {
        const usedNames = new Set(drivers.value.map(d => d.name));
        const availableNames = DRIVER_NAMES.filter(n => !usedNames.has(n));
        if (availableNames.length === 0) {
            // If all names used, start adding numbers
            return `Driver ${nextDriverId.value}`;
        }
        return availableNames[Math.floor(Math.random() * availableNames.length)];
    }

    // Helper function to create a new driver
    function createDriver(): Driver {
        const driverId = nextDriverId.value;
        nextDriverId.value = nextDriverId.value + 1; // Explicitly set to trigger persistence
        return {
            id: driverId,
            name: generateDriverName(),
            status: "available",
            lastAvailableTime: Date.now()
        };
    }

    const unlockedPizzas = persistent<string[]>([...G_CONF.STARTING_PIZZAS]);
    const introBonusApplied = persistent<boolean>(false);
    const chapter1BonusApplied = persistent<boolean>(false);
    const qualityBonus = persistent<number>(0); // Percentage bonus to earnings
    const speedBonus = persistent<number>(0);   // Percentage reduction to delivery time
    const driversInitialized = persistent<boolean>(false);

    // Computed: Available drivers sorted by who's been waiting longest
    const availableDrivers = computed(() => {
        // Get drivers that are not currently on a delivery
        const busyDriverIds = new Set(activeDeliveries.value.map(d => d.driverId));
        return drivers.value
            .filter(d => !busyDriverIds.has(d.id))
            .sort((a, b) => a.lastAvailableTime - b.lastAvailableTime);
    });

    // Read intro choices
    const introChoice = computed(() => {
        return (layers.intro as any)?.playerChoice?.value || "";
    });

    // Apply intro bonuses once when intro completes
    const introComplete = computed(() => {
        return (layers.intro as any)?.introComplete?.value || false;
    });

    // Watch for intro completion and apply bonuses reactively
    watch([introComplete, introChoice], ([complete, choice]) => {
        // Initialize starting drivers first if not done
        if (!driversInitialized.value) {
            console.log("Initializing starting drivers, nextDriverId:", nextDriverId.value);
            const newDrivers = [];
            for (let i = 0; i < G_CONF.STARTING_DRIVERS; i++) {
                const newDriver = createDriver();
                console.log("Created starting driver:", newDriver);
                newDrivers.push(newDriver);
            }
            drivers.value = newDrivers;
            console.log("After init, nextDriverId is now:", nextDriverId.value);
            driversInitialized.value = true;
        }

        if (complete && !introBonusApplied.value && choice) {
            if (choice === "hire_driver") {
                console.log("Applying intro bonus driver, nextDriverId:", nextDriverId.value);
                const bonusDrivers = [];
                for (let i = 0; i < G_CONF.INTRO_BONUS_DRIVERS; i++) {
                    const newDriver = createDriver();
                    console.log("Created intro bonus driver:", newDriver);
                    bonusDrivers.push(newDriver);
                }
                drivers.value = [...drivers.value, ...bonusDrivers];
                console.log("After intro bonus, all drivers:", drivers.value);
            } else if (choice === "buy_ingredients") {
                if (!unlockedPizzas.value.includes(G_CONF.INTRO_BONUS_PIZZA)) {
                    unlockedPizzas.value.push(G_CONF.INTRO_BONUS_PIZZA);
                }
            }
            introBonusApplied.value = true;
        }
    }, { immediate: true });

    // Chapter 1 - trigger and bonuses
    const chapter1Choice = computed(() => {
        return (layers.chapter1 as any)?.playerChoice?.value || "";
    });

    const chapter1Complete = computed(() => {
        return (layers.chapter1 as any)?.complete?.value || false;
    });

    const shouldShowChapter1 = computed(() => {
        return Decimal.gte(money.value, G_CONF.CHAPTER_1_TRIGGER) && !chapter1Complete.value;
    });

    // Watch for chapter 1 trigger
    watch(shouldShowChapter1, (should) => {
        if (should) {
            player.tabs = ["chapter1"];
        }
    }, { immediate: true });

    // Watch for chapter 1 completion and apply bonuses
    watch([chapter1Complete, chapter1Choice], ([complete, choice]) => {
        if (complete && !chapter1BonusApplied.value && choice) {
            if (choice === "quality") {
                qualityBonus.value = G_CONF.CHAPTER_1_QUALITY_BONUS;
            } else if (choice === "speed") {
                speedBonus.value = G_CONF.CHAPTER_1_SPEED_BONUS;
            }
            chapter1BonusApplied.value = true;
        }
    }, { immediate: true });

    // Chapter 2 - trigger
    const chapter2Complete = computed(() => {
        return (layers.chapter2 as any)?.complete?.value || false;
    });

    const shouldShowChapter2 = computed(() => {
        return Decimal.gte(money.value, G_CONF.CHAPTER_2_TRIGGER) && !chapter2Complete.value;
    });

    watch(shouldShowChapter2, (should) => {
        if (should) {
            player.tabs = ["chapter2"];
        }
    }, { immediate: true });

    // Chapter 3 - trigger
    const chapter3Complete = computed(() => {
        return (layers.chapter3 as any)?.complete?.value || false;
    });

    const shouldShowChapter3 = computed(() => {
        return Decimal.gte(money.value, G_CONF.CHAPTER_3_TRIGGER) && !chapter3Complete.value;
    });

    watch(shouldShowChapter3, (should) => {
        if (should) {
            player.tabs = ["chapter3"];
        }
    }, { immediate: true });

    // Chapter 4 - trigger
    const chapter4Complete = computed(() => {
        return (layers.chapter4 as any)?.complete?.value || false;
    });

    const shouldShowChapter4 = computed(() => {
        return Decimal.gte(money.value, G_CONF.CHAPTER_4_TRIGGER) && !chapter4Complete.value;
    });

    watch(shouldShowChapter4, (should) => {
        if (should) {
            player.tabs = ["chapter4"];
        }
    }, { immediate: true });

    const jobQueue = persistent<DeliveryJob[]>([]);
    const activeDeliveries = persistent<ActiveDelivery[]>([]);
    const nextJobId = persistent<number>(0);
    const timeSinceLastJob = persistent<number>(0);

    // Generate random job
    function generateJob(): DeliveryJob {
        const pizzaType = G_CONF.PIZZA_TYPES[Math.floor(Math.random() * Math.min(G_CONF.PIZZA_TYPES.length, unlockedPizzas.value.length + 1))];
        const baseDuration = G_CONF.JOB_DURATION_MIN + Math.floor(Math.random() * G_CONF.JOB_DURATION_MAX);
        let duration = baseDuration;
        const basePayout = G_CONF.JOB_PAYOUT_MIN + Math.floor(Math.random() * G_CONF.JOB_PAYOUT_MAX);
        const multiplier = G_CONF.PIZZA_TYPES.indexOf(pizzaType) + 1;

        // Apply speed bonus (reduce duration)
        if (speedBonus.value > 0) {
            duration = Math.floor(duration * (1 - speedBonus.value / 100));
        }

        // Apply quality bonus (increase payout)
        let payout = basePayout * multiplier;
        if (qualityBonus.value > 0) {
            payout = Math.floor(payout * (1 + qualityBonus.value / 100));
        }

        return {
            id: nextJobId.value++,
            duration,
            pizzaType,
            payout
        };
    }

    // Hire driver clickable
    const hireDriverClickable = createClickable(() => ({
        display: {
            title: "Hire Driver",
            description: () => `Cost: $${format(Decimal.pow(G_CONF.DRIVER_COST_MULTIPLIER, drivers.value.length).times(G_CONF.DRIVER_BASE_COST))}<br>Drivers: ${drivers.value.length}`
        },
        canClick: () => Decimal.gte(money.value, Decimal.pow(G_CONF.DRIVER_COST_MULTIPLIER, drivers.value.length).times(G_CONF.DRIVER_BASE_COST)),
        onClick() {
            money.value = Decimal.sub(money.value, Decimal.pow(G_CONF.DRIVER_COST_MULTIPLIER, drivers.value.length).times(G_CONF.DRIVER_BASE_COST));
            const newDriver = createDriver();
            console.log("Hiring driver:", newDriver, "nextDriverId now:", nextDriverId.value);
            drivers.value = [...drivers.value, newDriver];
        },
        style: {
            minHeight: "100px",
            width: "180px"
        }
    }));

    // Pizza unlock clickables
    const pizzaUnlockClickables = G_CONF.PIZZA_TYPES.slice(1).map((pizzaName) => {
        const pizzaCost = G_CONF.PIZZA_UNLOCK_COSTS[pizzaName as keyof typeof G_CONF.PIZZA_UNLOCK_COSTS];

        return createClickable(() => ({
            display: {
                title: `Unlock ${pizzaName}`,
                description: `Cost: $${pizzaCost}<br>Unlock ${pizzaName} pizza deliveries`
            },
            canClick: () => Decimal.gte(money.value, pizzaCost) && !unlockedPizzas.value.includes(pizzaName),
            onClick() {
                money.value = Decimal.sub(money.value, pizzaCost);
                unlockedPizzas.value.push(pizzaName);
            },
            visibility: () => !unlockedPizzas.value.includes(pizzaName),
            style: {
                minHeight: "100px",
                width: "180px"
            }
        }));
    });

    // Update logic
    globalBus.on("update", diff => {
        // Pause game until intro is complete
        const introLayer = layers.intro as any;
        if (introLayer && !introLayer.introComplete?.value) {
            return;
        }

        // Update active deliveries
        for (let i = activeDeliveries.value.length - 1; i >= 0; i--) {
            activeDeliveries.value[i].timeRemaining -= diff;

            if (activeDeliveries.value[i].timeRemaining <= 0) {
                const delivery = activeDeliveries.value[i];

                // Pay out the money
                money.value = Decimal.add(money.value, delivery.payout);

                // Update driver's lastAvailableTime for queue rotation
                const driverIndex = drivers.value.findIndex(d => d.id === delivery.driverId);
                if (driverIndex !== -1) {
                    drivers.value = drivers.value.map((d, idx) => {
                        if (idx === driverIndex) {
                            return {
                                ...d,
                                lastAvailableTime: Date.now()
                            };
                        }
                        return d;
                    });
                }

                // Remove the delivery - this automatically makes driver available again
                activeDeliveries.value.splice(i, 1);
            }
        }

        // Generate new jobs (only if at or below auto-generation limit)
        timeSinceLastJob.value += diff;
        if (timeSinceLastJob.value >= G_CONF.JOB_GENERATION_INTERVAL) {
            timeSinceLastJob.value = 0;
            if (jobQueue.value.length <= G_CONF.AUTO_JOB_LIMIT) {
                jobQueue.value.push(generateJob());
            }
        }

        // Initial jobs
        if (jobQueue.value.length === 0 && activeDeliveries.value.length === 0) {
            for (let i = 0; i < G_CONF.INITIAL_JOBS_COUNT; i++) {
                jobQueue.value.push(generateJob());
            }
        }
    });

    // Accept job
    function acceptJob(job: DeliveryJob) {
        const driver = availableDrivers.value[0];
        if (!driver) return; // Safety check

        const driverId = driver.id;

        // Remove job from queue
        jobQueue.value = jobQueue.value.filter(j => j.id !== job.id);

        // Add to active deliveries - this automatically makes driver unavailable
        // because our computed checks activeDeliveries
        activeDeliveries.value.push({
            ...job,
            timeRemaining: job.duration,
            driverId: driverId
        });
    }

    // Decline job
    function declineJob(jobId: number) {
        jobQueue.value = jobQueue.value.filter(j => j.id !== jobId);
    }

    // Can accept job
    function canAcceptJob(job: DeliveryJob): boolean {
        return availableDrivers.value.length > 0 && unlockedPizzas.value.includes(job.pizzaType);
    }

    // Display
    const display: JSXFunction = () => {
        return (
            <div>
                <h2>Pizza Delivery Empire</h2>

                <div style="margin: 20px 0; padding: 15px; border: 2px solid #FFA500; border-radius: 10px; background: #fff3e0;">
                    <h3>Resources</h3>
                    <div style="font-size: 18px;"><strong>Money:</strong> ${format(money.value)}</div>
                    <div style="font-size: 16px;"><strong>Drivers:</strong> {availableDrivers.value.length} / {drivers.value.length} available</div>
                    <div style="font-size: 16px;"><strong>Unlocked Pizzas:</strong> {unlockedPizzas.value.join(", ")}</div>
                </div>

                <div style="margin: 20px 0;">
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        {render(hireDriverClickable)}
                        {pizzaUnlockClickables.map(clickable => render(clickable))}
                    </div>
                </div>

                <div style="margin: 20px 0; padding: 15px; border: 2px solid #2196F3; border-radius: 10px; background: #e3f2fd;">
                    <h3>Active Deliveries ({activeDeliveries.value.length})</h3>
                    {activeDeliveries.value.length === 0 ? (
                        <p style="font-style: italic;">No active deliveries</p>
                    ) : (
                        activeDeliveries.value.map(delivery => {
                            const driver = drivers.value.find(d => d.id === delivery.driverId);
                            return (
                                <div key={delivery.id} style="margin: 10px 0; padding: 10px; background: white; border-radius: 5px; border: 1px solid #ddd;">
                                    <div><strong>🚗 {driver?.name || `Driver #${delivery.driverId}`}:</strong> Delivering {delivery.pizzaType} pizza</div>
                                    <div><strong>⏱️ Time Remaining:</strong> {Math.ceil(delivery.timeRemaining)}s</div>
                                    <div style="color: #2e7d32;"><strong>💰 Will Earn:</strong> ${format(delivery.payout)}</div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div style="margin: 20px 0; padding: 15px; border: 2px solid #4CAF50; border-radius: 10px; background: #e8f5e9;">
                    <h3>Available Jobs ({jobQueue.value.length})</h3>
                    {jobQueue.value.length === 0 ? (
                        <p style="font-style: italic;">No jobs available. New jobs arrive every 60 seconds.</p>
                    ) : (
                        jobQueue.value.map(job => (
                            <div key={job.id} style="margin: 10px 0; padding: 10px; background: white; border-radius: 5px; border: 1px solid #ddd;">
                                <div><strong>Pizza:</strong> {job.pizzaType}</div>
                                <div><strong>Duration:</strong> {job.duration}s</div>
                                <div><strong>Payout:</strong> ${format(job.payout)}</div>
                                <div style="margin-top: 10px;">
                                    <button
                                        onClick={() => acceptJob(job)}
                                        disabled={!canAcceptJob(job)}
                                        style={{
                                            background: canAcceptJob(job) ? "#4CAF50" : "#ccc",
                                            color: "white",
                                            padding: "8px 16px",
                                            marginRight: "5px",
                                            border: "none",
                                            borderRadius: "4px",
                                            cursor: canAcceptJob(job) ? "pointer" : "not-allowed",
                                            fontSize: "14px"
                                        }}
                                    >
                                        Accept
                                    </button>
                                    <button
                                        onClick={() => declineJob(job.id)}
                                        style={{
                                            background: "#f44336",
                                            color: "white",
                                            padding: "8px 16px",
                                            border: "none",
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                            fontSize: "14px"
                                        }}
                                    >
                                        Decline
                                    </button>
                                    {!unlockedPizzas.value.includes(job.pizzaType) && (
                                        <span style="color: #d32f2f; margin-left: 10px; font-weight: bold;">⚠ Need {job.pizzaType} pizza unlocked!</span>
                                    )}
                                    {availableDrivers.value <= 0 && unlockedPizzas.value.includes(job.pizzaType) && (
                                        <span style="color: #d32f2f; margin-left: 10px; font-weight: bold;">⚠ No drivers available!</span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {Decimal.gte(money.value, G_CONF.WIN_AMOUNT) && (
                    <div style="margin: 20px 0; padding: 30px; background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%); border-radius: 10px; text-align: center; border: 3px solid #ff6f00; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
                        <h1 style="font-size: 48px; margin: 0;">🎉 YOU WIN! 🎉</h1>
                        <p style="font-size: 24px; margin: 10px 0;">You've earned ${format(G_CONF.WIN_AMOUNT)}!</p>
                        <p style="font-size: 18px;">You've built a successful pizza delivery empire!</p>
                    </div>
                )}

                <button
                    onClick={() => optionsModal.value?.open()}
                    style={{
                        position: "fixed",
                        bottom: "20px",
                        left: "20px",
                        background: "var(--raised-background)",
                        border: "2px solid var(--outline)",
                        borderRadius: "50%",
                        cursor: "pointer",
                        fontSize: "32px",
                        color: "var(--foreground)",
                        padding: "10px",
                        width: "60px",
                        height: "60px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                        zIndex: 1000
                    }}
                    title="Settings"
                >
                    ⚙️
                </button>

                <Options ref={optionsModal} />
            </div>
        );
    };

    return {
        name,
        color,
        money,
        best,
        total,
        unlockedPizzas,
        drivers,
        nextDriverId,
        driversInitialized,
        introBonusApplied,
        chapter1BonusApplied,
        qualityBonus,
        speedBonus,
        jobQueue,
        activeDeliveries,
        nextJobId,
        timeSinceLastJob,
        hireDriverClickable,
        pizzaUnlockClickables,
        display,
        treeNode: createTreeNode(() => ({
            display: name,
            color
        }))
    };
});

export default layer;
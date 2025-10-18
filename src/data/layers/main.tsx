import { createLayer } from "game/layers";
import { createResource, trackBest, trackTotal } from "features/resources/resource";
import { createClickable } from "features/clickables/clickable";
import { jsx, JSXFunction } from "game/common";
import { createTreeNode } from "features/trees/tree";
import Decimal, { DecimalSource, format } from "util/bignum";
import { render } from "util/vue";
import { computed, ref, Ref } from "vue";
import { globalBus } from "game/events";
import { noPersist } from "game/persistence";

// Pizza types that can be unlocked
const PIZZA_TYPES = ["Cheese", "Pepperoni", "Supreme", "Hawaiian", "Meat Lovers"];

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

    // Resources
    const money = createResource<DecimalSource>(10, "dollars");
    const best = trackBest(money);
    const total = trackTotal(money);

    // Persistent state
    const unlockedPizzas: Ref<string[]> = ref(["Cheese"]);
    const totalDrivers: Ref<number> = ref(1);
    const jobQueue: Ref<DeliveryJob[]> = ref([]);
    const activeDeliveries: Ref<ActiveDelivery[]> = ref([]);
    const nextJobId = ref(0);
    const timeSinceLastJob = ref(0);

    // Available drivers
    const availableDrivers = computed(() => {
        return totalDrivers.value - activeDeliveries.value.length;
    });

    // Generate random job
    function generateJob(): DeliveryJob {
        const pizzaType = PIZZA_TYPES[Math.floor(Math.random() * Math.min(PIZZA_TYPES.length, unlockedPizzas.value.length + 2))];
        const duration = 10 + Math.floor(Math.random() * 50);
        const basePayout = 10 + Math.floor(Math.random() * 40);
        const multiplier = PIZZA_TYPES.indexOf(pizzaType) + 1;
        
        return {
            id: nextJobId.value++,
            duration,
            pizzaType,
            payout: basePayout * multiplier
        };
    }

    // Hire driver clickable
    const hireDriverClickable = createClickable(() => ({
        display: {
            title: "Hire Driver",
            description: () => `Cost: $${format(Decimal.pow(1.5, totalDrivers.value).times(100))}<br>Drivers: ${totalDrivers.value}`
        },
        canClick: () => Decimal.gte(money.value, Decimal.pow(1.5, totalDrivers.value).times(100)),
        onClick() {
            money.value = Decimal.sub(money.value, Decimal.pow(1.5, totalDrivers.value).times(100));
            totalDrivers.value++;
        },
        style: {
            minHeight: "100px",
            width: "180px"
        }
    }));

    // Pizza unlock clickables
    const pizzaUnlockClickables = PIZZA_TYPES.slice(1).map((pizzaName, index) => {
        const costs = [50, 150, 400, 1000];
        const pizzaCost = costs[index];
        
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
        // Update active deliveries
        for (let i = activeDeliveries.value.length - 1; i >= 0; i--) {
            activeDeliveries.value[i].timeRemaining -= diff;
            
            if (activeDeliveries.value[i].timeRemaining <= 0) {
                money.value = Decimal.add(money.value, activeDeliveries.value[i].payout);
                activeDeliveries.value.splice(i, 1);
            }
        }

        // Generate new jobs
        timeSinceLastJob.value += diff;
        //if (timeSinceLastJob.value >= 60) {
	if (timeSinceLastJob.value >= 20) {  // Faster for dev
            timeSinceLastJob.value = 0;
            jobQueue.value.push(generateJob());
        }

        // Initial jobs
        if (jobQueue.value.length === 0 && activeDeliveries.value.length === 0) {
            for (let i = 0; i < 3; i++) {
                jobQueue.value.push(generateJob());
            }
        }
    });

    // Accept job
    function acceptJob(job: DeliveryJob) {
        jobQueue.value = jobQueue.value.filter(j => j.id !== job.id);
        activeDeliveries.value.push({
            ...job,
            timeRemaining: job.duration,
            driverId: activeDeliveries.value.length + 1
        });
    }

    // Decline job
    function declineJob(jobId: number) {
        jobQueue.value = jobQueue.value.filter(j => j.id !== jobId);
    }

    // Can accept job
    function canAcceptJob(job: DeliveryJob): boolean {
        return availableDrivers.value > 0 && unlockedPizzas.value.includes(job.pizzaType);
    }

    // Display
    const display: JSXFunction = () => {
        return (
            <div>
                <h2>Pizza Delivery Empire</h2>
                
                <div style="margin: 20px 0; padding: 15px; border: 2px solid #FFA500; border-radius: 10px; background: #fff3e0;">
                    <h3>Resources</h3>
                    <div style="font-size: 18px;"><strong>Money:</strong> ${format(money.value)}</div>
                    <div style="font-size: 16px;"><strong>Drivers:</strong> {availableDrivers.value} / {totalDrivers.value} available</div>
                    <div style="font-size: 16px;"><strong>Unlocked Pizzas:</strong> {unlockedPizzas.value.join(", ")}</div>
                </div>

                <div style="margin: 20px 0;">
                    <h3>Shop</h3>
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
                        activeDeliveries.value.map(delivery => (
                            <div key={delivery.id} style="margin: 10px 0; padding: 10px; background: white; border-radius: 5px; border: 1px solid #ddd;">
                                <div><strong>🚗 Driver #{delivery.driverId}:</strong> Delivering {delivery.pizzaType} pizza</div>
                                <div><strong>⏱️ Time Remaining:</strong> {Math.ceil(delivery.timeRemaining)}s</div>
                                <div style="color: #2e7d32;"><strong>💰 Will Earn:</strong> ${format(delivery.payout)}</div>
                            </div>
                        ))
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

                {Decimal.gte(money.value, 1000000) && (
                    <div style="margin: 20px 0; padding: 30px; background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%); border-radius: 10px; text-align: center; border: 3px solid #ff6f00; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
                        <h1 style="font-size: 48px; margin: 0;">🎉 YOU WIN! 🎉</h1>
                        <p style="font-size: 24px; margin: 10px 0;">You've earned $1,000,000!</p>
                        <p style="font-size: 18px;">You've built a successful pizza delivery empire!</p>
                    </div>
                )}
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
        totalDrivers,
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
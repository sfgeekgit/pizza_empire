import { createLayer } from "game/layers";
import Decimal from "util/bignum";
import { ref } from "vue";
import { persistent } from "game/persistence";
import player from "game/player";

const id = "intro";
const layer = createLayer(id, function (this: any) {
    const name = "Introduction";
    const color = "#FFA500";

    // Persistent state
    const introComplete = persistent<boolean>(false);
    const playerChoice = persistent<string>("", false); // false = don't check for NaN on strings
    const currentPage = ref(0);

    // Story pages
    const pages = [
        {
            title: "Welcome to Pizza Delivery Empire!",
            content: (
                <div style="text-align: left; max-width: 600px; margin: 40px auto; line-height: 1.6;">
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        You've just inherited a small pizza shop from your uncle. The shop is modest,
                        but it has potential!
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        Your uncle left you $10 to get started, and you have one delivery driver
                        ready to work.
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        Your dream is to build a pizza delivery empire and reach <strong>$1,000,000</strong>
                        in earnings. Let's get started!
                    </p>
                </div>
            )
        },
        {
            title: "A Lucky Break",
            content: (
                <div style="text-align: left; max-width: 600px; margin: 40px auto; line-height: 1.6;">
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        While cleaning the shop, you find an envelope behind the cash register.
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        Inside is some extra money your uncle saved! You have a choice:
                    </p>
                    <p style="font-size: 16px; margin-bottom: 30px; font-style: italic;">
                        What will you invest in?
                    </p>
                </div>
            ),
            choices: [
                {
                    id: "hire_driver",
                    text: "Hire an Extra Driver",
                    description: "Start with 2 drivers instead of 1",
                    effect: "bonusDrivers"
                },
                {
                    id: "buy_ingredients",
                    text: "Buy Premium Ingredients",
                    description: "Start with Pepperoni pizza unlocked",
                    effect: "bonusPizzas"
                }
            ]
        },
        {
            title: "Ready to Begin!",
            content: (
                <div style="text-align: left; max-width: 600px; margin: 40px auto; line-height: 1.6;">
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        Your first customer is calling right now with an order!
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        Time to start your journey to pizza empire greatness. Good luck!
                    </p>
                </div>
            )
        }
    ];

    function makeChoice(choiceId: string) {
        playerChoice.value = choiceId;
        currentPage.value++;
    }

    function completeIntro() {
        introComplete.value = true;
        player.tabs = ["main"];
    }

    function nextPage() {
        currentPage.value++;

        // If we've seen all pages, complete the intro
        if (currentPage.value >= pages.length) {
            completeIntro();
        }
    }

    const display = () => {
        const page = pages[currentPage.value];

        if (!page) {
            completeIntro();
            return null;
        }

        const isChoicePage = page.choices && page.choices.length > 0;
        const isLastPage = currentPage.value === pages.length - 1;

        return (
            <div>
                <h2 style="color: #FFA500; font-size: 32px; margin-bottom: 30px;">{page.title}</h2>

                <div style="margin: 20px 0; padding: 30px; border: 2px solid #FFA500; border-radius: 10px; background: #fff3e0;">
                    {page.content}
                </div>

                <div style="margin: 30px 0; display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                    {isChoicePage ? (
                        // Show choices
                        page.choices!.map(choice => (
                            <div key={choice.id} style="text-align: center;">
                                <button
                                    onClick={() => makeChoice(choice.id)}
                                    style={{
                                        background: "#4CAF50",
                                        color: "white",
                                        padding: "15px 30px",
                                        fontSize: "18px",
                                        border: "none",
                                        borderRadius: "8px",
                                        cursor: "pointer",
                                        minWidth: "200px",
                                        fontWeight: "bold"
                                    }}
                                >
                                    {choice.text}
                                </button>
                                <p style="font-size: 14px; margin-top: 10px; color: #666;">
                                    {choice.description}
                                </p>
                            </div>
                        ))
                    ) : (
                        // Show continue/start button
                        <button
                            onClick={nextPage}
                            style={{
                                background: isLastPage ? "#FF6F00" : "#2196F3",
                                color: "white",
                                padding: "15px 40px",
                                fontSize: "20px",
                                border: "none",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontWeight: "bold"
                            }}
                        >
                            {isLastPage ? "Start Game!" : "Continue"}
                        </button>
                    )}
                </div>

                <div style="margin-top: 40px; font-size: 14px; color: #666;">
                    Page {currentPage.value + 1} of {pages.length}
                </div>
            </div>
        );
    };

    return {
        name,
        color,
        display,
        introComplete,
        playerChoice,
        currentPage
    };
});

export default layer;

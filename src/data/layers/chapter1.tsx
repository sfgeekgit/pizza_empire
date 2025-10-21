import { createLayer } from "game/layers";
import Decimal from "util/bignum";
import { ref } from "vue";
import { persistent } from "game/persistence";
import player from "game/player";
import { G_CONF } from "../gameConfig";

const id = "chapter1";
const layer = createLayer(id, function (this: any) {
    const name = "Chapter 1: The Competitor";
    const color = "#FFA500";

    // Persistent state
    const complete = persistent<boolean>(false);
    const playerChoice = persistent<string>("", false); // false = don't check for NaN on strings
    const currentPage = ref(0);

    // Story pages
    const pages = [
        {
            title: "A Rival Appears",
            content: (
                <div style="text-align: left; max-width: 600px; margin: 40px auto; line-height: 1.6;">
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        Your pizza business is off to a great start! You've made over $100 already.
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        But success attracts attention...
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        A flashy new pizza place just opened across the street: <strong>"Tony's Speedy Pizza"</strong>.
                        They're advertising lightning-fast delivery and rock-bottom prices.
                    </p>
                </div>
            )
        },
        {
            title: "The Challenge",
            content: (
                <div style="text-align: left; max-width: 600px; margin: 40px auto; line-height: 1.6;">
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        Tony walks into your shop with a smug grin.
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px; font-style: italic; color: #d32f2f;">
                        "Nice little operation you got here. Too bad I'm about to put you out of business.
                        My pizzas are cheaper AND faster!"
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        You notice customers starting to glance at Tony's flashy storefront...
                    </p>
                </div>
            )
        },
        {
            title: "Your Response",
            content: (
                <div style="text-align: left; max-width: 600px; margin: 40px auto; line-height: 1.6;">
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        You need to respond to this competition. How will you compete?
                    </p>
                    <p style="font-size: 16px; margin-bottom: 30px; font-style: italic;">
                        Choose your strategy:
                    </p>
                </div>
            ),
            choices: [
                {
                    id: "quality",
                    text: "Focus on Quality",
                    description: `Higher payouts per delivery (+${G_CONF.CHAPTER_1_QUALITY_BONUS}% earnings)`,
                    effect: "qualityBonus"
                },
                {
                    id: "speed",
                    text: "Focus on Speed",
                    description: `Faster delivery times (-${G_CONF.CHAPTER_1_SPEED_BONUS}% delivery duration)`,
                    effect: "speedBonus"
                }
            ]
        },
        {
            title: "Putting the Plan into Action",
            content: (
                <div style="text-align: left; max-width: 600px; margin: 40px auto; line-height: 1.6;">
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        You implement your new strategy with determination.
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        Word starts spreading through the neighborhood about your commitment to excellence.
                        Customers appreciate the extra effort you're putting in.
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        Tony's shop is still busy, but you're holding your own.
                    </p>
                </div>
            )
        },
        {
            title: "First Round to You",
            content: (
                <div style="text-align: left; max-width: 600px; margin: 40px auto; line-height: 1.6;">
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        Your new strategy is working! Customers are choosing your shop over Tony's more often.
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        One evening, Tony storms into your shop, red-faced and frustrated.
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px; font-style: italic; color: #d32f2f;">
                        "You got lucky this time," he growls. "But this isn't over. Not by a long shot!"
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        He storms out, and you can see through the window that Tony's Speedy Pizza is still open for business.
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px; font-weight: bold;">
                        The rivalry continues...
                    </p>
                </div>
            )
        }
    ];

    function makeChoice(choiceId: string) {
        playerChoice.value = choiceId;
        currentPage.value++;
    }

    function completeChapter() {
        complete.value = true;
        player.tabs = ["main"];
    }

    function nextPage() {
        currentPage.value++;

        // If we've seen all pages, complete the chapter
        if (currentPage.value >= pages.length) {
            completeChapter();
        }
    }

    const display = (() => {

        const page = pages[currentPage.value];

        if (!page) {
            completeChapter();
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
                                        background: choice.id === "quality" ? "#4CAF50" : "#2196F3",
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
                        // Show continue/complete button
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
                            {isLastPage ? "Back to Business!" : "Continue"}
                        </button>
                    )}
                </div>

                <div style="margin-top: 40px; font-size: 14px; color: #666;">
                    Page {currentPage.value + 1} of {pages.length}
                </div>
            </div>
        );
    //};
    }) as any;
    

    return {
        name,
        color,
        display,
        complete,
        playerChoice,
        currentPage
    };
});

export default layer;

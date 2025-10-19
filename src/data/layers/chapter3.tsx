import { createLayer } from "game/layers";
import Decimal from "util/bignum";
import { ref } from "vue";
import { persistent } from "game/persistence";
import player from "game/player";

const id = "chapter3";
const layer = createLayer(id, function (this: any) {
    const name = "Chapter 3: The Chain";
    const color = "#FFA500";

    // Persistent state
    const complete = persistent<boolean>(false);
    const currentPage = ref(0);

    // Story pages
    const pages = [
        {
            title: "A New Threat",
            content: (
                <div style="text-align: left; max-width: 600px; margin: 40px auto; line-height: 1.6;">
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        $2,000! Your business is booming, and you're becoming well-known in the area.
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        But one morning, you see construction crews working on the empty lot down the street.
                    </p>
                    <p style="font-size: 20px; margin-bottom: 20px; font-weight: bold; color: #d32f2f; text-align: center;">
                        "COMING SOON: MEGA PIZZA CHAIN"
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        A massive corporate chain is moving into your neighborhood.
                    </p>
                </div>
            )
        },
        {
            title: "Tony's Warning",
            content: (
                <div style="text-align: left; max-width: 600px; margin: 40px auto; line-height: 1.6;">
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        Tony rushes into your shop, looking worried.
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px; font-style: italic; color: #d32f2f;">
                        "They'll undercut both of us! They've got massive budgets, loyalty programs, apps...
                        We're both in trouble."
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        For the first time, Tony isn't your competitor - he's your ally.
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        You both realize that local businesses need to stick together against giant corporations.
                    </p>
                </div>
            )
        },
        {
            title: "The Local Alliance",
            content: (
                <div style="text-align: left; max-width: 600px; margin: 40px auto; line-height: 1.6;">
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        You and Tony organize a "Support Local Pizza" campaign.
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        The neighborhood rallies behind you both. Customers appreciate the personal service
                        and quality that only local businesses can provide.
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        Together, you and Tony prove that community matters more than corporate efficiency.
                    </p>
                </div>
            )
        },
        {
            title: "Surviving Together",
            content: (
                <div style="text-align: left; max-width: 600px; margin: 40px auto; line-height: 1.6;">
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        The mega chain opens, but your loyal customer base stays strong.
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px; font-style: italic; color: #2e7d32;">
                        Tony grins at you: "Who would've thought? We make a pretty good team!"
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        Your business not only survives - it thrives by being genuine and local.
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px; font-weight: bold;">
                        But success brings new challenges...
                    </p>
                </div>
            )
        }
    ];

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

    const display = () => {
        const page = pages[currentPage.value];

        if (!page) {
            completeChapter();
            return null;
        }

        const isLastPage = currentPage.value === pages.length - 1;

        return (
            <div>
                <h2 style="color: #FFA500; font-size: 32px; margin-bottom: 30px;">{page.title}</h2>

                <div style="margin: 20px 0; padding: 30px; border: 2px solid #FFA500; border-radius: 10px; background: #fff3e0;">
                    {page.content}
                </div>

                <div style="margin: 30px 0; display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
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
        complete,
        currentPage
    };
});

export default layer;

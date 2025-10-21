import { createLayer } from "game/layers";
import Decimal from "util/bignum";
import { ref } from "vue";
import { persistent } from "game/persistence";
import player from "game/player";

const id = "chapter4";
const layer = createLayer(id, function (this: any) {
    const name = "Chapter 4: The Legacy";
    const color = "#FFA500";

    // Persistent state
    const complete = persistent<boolean>(false);
    const currentPage = ref(0);

    // Story pages
    const pages = [
        {
            title: "Media Attention",
            content: (
                <div style="text-align: left; max-width: 600px; margin: 40px auto; line-height: 1.6;">
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        $3,000 in the bank! You're now one of the most successful local businesses in the area.
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        A local news reporter shows up at your door with a camera crew.
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px; font-style: italic;">
                        "We're doing a story on local business success! How did you and Tony turn rivalry
                        into partnership?"
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        Your story is about to inspire others...
                    </p>
                </div>
            )
        },
        {
            title: "Inspiring Others",
            content: (
                <div style="text-align: left; max-width: 600px; margin: 40px auto; line-height: 1.6;">
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        The news segment airs, and suddenly you're getting calls from small business owners
                        all over the city.
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        They want advice on how to compete with big chains while maintaining their values.
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        You and Tony decide to host a workshop: "Building Community Through Competition."
                    </p>
                </div>
            )
        },
        {
            title: "The Workshop",
            content: (
                <div style="text-align: left; max-width: 600px; margin: 40px auto; line-height: 1.6;">
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        Dozens of local business owners attend your workshop.
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px; font-style: italic; color: #d32f2f;">
                        Tony tells them: "Competition made us better. But community made us unstoppable."
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px; font-style: italic; color: #2e7d32;">
                        You add: "Focus on quality, treat your people right, and stay true to your values.
                        The rest will follow."
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        The local business alliance grows stronger every day.
                    </p>
                </div>
            )
        },
        {
            title: "A Lasting Partnership",
            content: (
                <div style="text-align: left; max-width: 600px; margin: 40px auto; line-height: 1.6;">
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        Months later, you and Tony are sitting together, looking at your thriving shops.
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px; font-style: italic; color: #d32f2f;">
                        "Remember when I called you lucky?" Tony laughs. "Turns out we both made our own luck."
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        What started as a fierce rivalry became a partnership that lifted up the entire community.
                    </p>
                    <p style="font-size: 20px; margin-bottom: 20px; font-weight: bold; color: #2e7d32; text-align: center;">
                        You've built more than a business - you've built a legacy.
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

    const display = (() => {

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
    }) as any;

    return {
        name,
        color,
        display,
        complete,
        currentPage
    };
});

export default layer;

import { createLayer } from "game/layers";
import Decimal from "util/bignum";
import { ref } from "vue";
import { persistent } from "game/persistence";
import player from "game/player";

const id = "chapter2";
const layer = createLayer(id, function (this: any) {
    const name = "Chapter 2: The Expansion";
    const color = "#FFA500";

    // Persistent state
    const complete = persistent<boolean>(false);
    const currentPage = ref(0);

    // Story pages
    const pages = [
        {
            title: "Tony's Countermove",
            content: (
                <div style="text-align: left; max-width: 600px; margin: 40px auto; line-height: 1.6;">
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        You've reached $1,000! Your pizza delivery business is thriving.
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        But Tony isn't giving up. You notice his shop has a huge new banner:
                    </p>
                    <p style="font-size: 20px; margin-bottom: 20px; font-weight: bold; color: #d32f2f; text-align: center;">
                        "TONY'S SPEEDY PIZZA - NOW WITH PREMIUM TOPPINGS!"
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        He's expanding his menu to compete with you directly.
                    </p>
                </div>
            )
        },
        {
            title: "Observation",
            content: (
                <div style="text-align: left; max-width: 600px; margin: 40px auto; line-height: 1.6;">
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        Over the next few days, you watch Tony's operation carefully.
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        His drivers are working overtime, and his kitchen is bustling with activity.
                        The competition is heating up.
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        Some of your regular customers mention trying Tony's new premium pizzas.
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px; font-style: italic;">
                        You need to stay ahead of the game...
                    </p>
                </div>
            )
        },
        {
            title: "A Lesson Learned",
            content: (
                <div style="text-align: left; max-width: 600px; margin: 40px auto; line-height: 1.6;">
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        One evening, a health inspector shows up at Tony's shop.
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        Word spreads quickly - Tony was cutting corners on food safety to keep up with demand!
                        He gets hit with a hefty fine.
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        The next day, Tony appears at your door, looking defeated.
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px; font-style: italic; color: #d32f2f;">
                        "Alright, alright... maybe I was trying too hard to beat you. I'll do things properly from now on."
                    </p>
                </div>
            )
        },
        {
            title: "Mutual Respect",
            content: (
                <div style="text-align: left; max-width: 600px; margin: 40px auto; line-height: 1.6;">
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        You and Tony reach an understanding - competition is healthy, but not at the expense of quality and safety.
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px; font-style: italic; color: #2e7d32;">
                        "May the best pizza win," Tony says with a genuine smile for the first time.
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        Your business continues to grow stronger, and you've earned Tony's respect.
                    </p>
                    <p style="font-size: 18px; margin-bottom: 20px; font-weight: bold;">
                        But the pizza delivery market is getting crowded...
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

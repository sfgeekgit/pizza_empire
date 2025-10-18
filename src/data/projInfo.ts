/**
 * @module
 * @hidden
 */
import { Themes } from "./themes";

export default {
    title: "Pizza Delivery Empire",
    id: "pizza-delivery",
    author: "Your Name",
    discordName: "",
    discordLink: "",
    
    // Game version
    versionNumber: "0.1",
    versionTitle: "Prototype",
    
    changelog: `
        <h3>v0.1 - Prototype</h3>
        - Initial release<br>
        - Basic pizza delivery mechanics<br>
        - 5 pizza types to unlock<br>
        - Hire drivers<br>
        - Accept/decline delivery jobs<br>
        - Win condition: $1,000,000
    `,
    
    // Initial save data
    initialTabs: ["main"],
    
    // Maximum tick length (in milliseconds)
    maxTickLength: 3600000, // 1 hour
    
    // Game settings
    enablePausing: true,
    
    // Default theme
    defaultTheme: Themes.Classic,
    
    // Show the news ticker at the bottom
    showNews: false
};
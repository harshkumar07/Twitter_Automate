import dotenv from "dotenv";
import { firefox } from "playwright";
import { GoogleGenerativeAI } from "@google/generative-ai";
dotenv.config();

async function generateContent(message: string) {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(message);
        const response = await result.response;
        const text = response.text();
        console.log("✅ Generated content:", text);
        return text;
    } catch (error: any) {
        console.error("Failed to generate content:", error.message);
        return null;
    }
}

(async () => {
    const tweetPrompts = [
        "Write a powerful tweet about a tech innovation that feels like it's changing everything.",
        "Create a tweet that highlights how fast technology is evolving in 2025.",
        "Generate a tweet about a startup using tech to disrupt an old industry.",
        "Write a tweet that makes people excited about the future of AI and tech.",
        "Create a tweet that explains a big tech idea in a fun and simple way.",
        "Write a tweet on how innovation in tech is reshaping everyday life.",
        "Draft a tweet showing how modern tools are helping developers move faster.",
        "Create a tweet about the impact of automation on daily workflows.",
        "Write a tweet highlighting the magic of building in public as a dev.",
        "Tweet an insight about how AI is augmenting human creativity."
    ];
    function getRandomPrompt(): string {
        const index = Math.floor(Math.random() * tweetPrompts.length);
        return tweetPrompts[index];
    }

    // const message = "Write a tweet about tech innovation.";
    const message = getRandomPrompt();
    let tweet = await generateContent(message + "under 50 words");
    // tweet= "This tweet was auto-generated using an AI tool while I enjoyed my coffee break. Curious how? Details in the reply. ☕📲"



    if (!tweet) {
        console.error("Tweet generation failed. Exiting...");
        process.exit(1);
    }

    const browser = await firefox.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto("https://x.com/i/flow/login", { waitUntil: "networkidle" });
        await page.waitForTimeout(10000);

        try {
            console.log("Trying to find and fill username...");
            const input = await page.waitForSelector('input[name="text"]', { timeout: 10000 });
            await input.fill(process.env.TWITTER_USERNAME!);
            await page.keyboard.press("Enter");
            console.log("✅ Username filled and submitted.");

        } catch (err) {
            console.warn("⚠️ Username input not found yet. Retrying in 2s...");
            await page.waitForTimeout(2000); // Wait before retrying
        }


        let passwordEntered = false;
        try {
            await page.waitForSelector('input[name="password"]', { timeout: 5000 });
            await page.fill('input[name="password"]', process.env.TWITTER_PASSWORD!);
            await page.keyboard.press("Enter");
            passwordEntered = true;
        } catch {
            console.warn("Password field not found initially. Might need phone verification.");
        }

        if (!passwordEntered) {
            try {
                const phoneInput = await page.waitForSelector(
                    'xpath=/html/body/div/div/div/div[1]/div/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div[1]/div/div[2]/label/div/div[2]/div/input',
                    { timeout: 5000 }
                );

                if (phoneInput) {
                    console.log("📱 Filling phone number...");
                    await page.waitForTimeout(3000);
                    await phoneInput.fill(process.env.TWITTER_PHONE!);
                    console.log("Phone number filled");
                    await page.keyboard.press("Enter");
                    await page.waitForTimeout(3000);
                    console.log("Enter");
                }

                // Retry password after phone
                console.log("Password Type");

                const passwordInput = await page.waitForSelector(
                    'xpath=/html/body/div/div/div/div[1]/div[2]/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div[1]/div/div/div[3]/div/label/div/div[2]/div[1]/input'
                  );
                  
                  // Click to focus the input
                  await passwordInput.click({ force: true });
                  console.log("🖱️ Clicked password input");
                  
                  // Fill the password
                  await passwordInput.fill(process.env.TWITTER_PASSWORD!);
                  console.log("🔐 Password filled");
                  
                  // Submit by pressing Enter
                  await page.keyboard.press("Enter");
                  console.log("📨 Submitted login form");
                  

                // Press Enter to submit
                await page.keyboard.press("Enter");
                console.log("📨 Submitted login form");

                // await page.waitForSelector('input[name="password"]');
                // console.log("Password");
                // await page.waitForTimeout(5000);
                // await page.fill('input[name="password"]', process.env.TWITTER_PASSWORD!);
                // console.log("Password filled");
                // await page.keyboard.press("Enter");
                // await page.waitForTimeout(3000);
                console.log("Login Successfully")
            } catch (err) {
                await page.screenshot({ path: "error-screenshot.png", fullPage: true });
                process.exit(1);
            }
        }


        // const errorText = await page.locator("text=Something went wrong").first();
        // if (await errorText.isVisible()) {
        //     console.warn("⚠️ Twitter login error: 'Something went wrong'.");
        //     const tryAgain = await page.locator("text=Try again").first();
        //     if (await tryAgain.isVisible()) {
        //         console.log("🔁 Retrying login...");
        //         await tryAgain.click();
        //         await page.waitForTimeout(3000);
        //     } else {
        //         await page.screenshot({ path: "error-login-failed.png" });
        //         process.exit(1);
        //     }
        // }


        console.log("🚀 Navigating to tweet composer...");
        await page.goto("https://x.com/compose/post");
        await page.waitForTimeout(3000);
        console.log("Post page");

        await page.keyboard.type(tweet, { delay: 20 });
        console.log("typing data");
        await page.getByRole("button", { name: "Choose audience" }).click();
        console.log("select");
        await page.waitForTimeout(3000);
        await page.getByRole('menuitem', { name: 'Build in Public' }).click();
        console.log("Index 1");

        await page.waitForTimeout(2000);

        await page.click('button[data-testid="tweetButton"]');


        console.log("✅ Tweet posted!");
        await page.waitForTimeout(30000);


    } catch (err) {
        console.error(" Unexpected error:", err);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();

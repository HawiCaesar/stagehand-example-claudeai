import { Stagehand, Page, BrowserContext } from "@browserbasehq/stagehand";
import StagehandConfig from "./stagehand.config.js";
import chalk from "chalk";
import boxen from "boxen";
import { drawObserveOverlay, clearOverlays, actWithCache } from "./utils.js";
import { z } from "zod";

/**
 * 🤘 Welcome to Stagehand! Thanks so much for trying us out!
 * 🛠️ CONFIGURATION: stagehand.config.ts will help you configure Stagehand
 *
 * 📝 Check out our docs for more fun use cases, like building agents
 * https://docs.stagehand.dev/
 *
 * 💬 If you have any feedback, reach out to us on Slack!
 * https://stagehand.dev/slack
 *
 * 📚 You might also benefit from the docs for Zod, Browserbase, and Playwright:
 * - https://zod.dev/
 * - https://docs.browserbase.com/
 * - https://playwright.dev/docs/intro
 */
async function main({
  page,
  context,
  stagehand,
}: {
  page: Page; // Playwright Page with act, extract, and observe methods
  context: BrowserContext; // Playwright BrowserContext
  stagehand: Stagehand; // Stagehand instance
}) {

  // Navigate to GitHub profile to confirm the link
  await page.goto("https://github.com/HawiCaesar/hawicaesar");

  // First, let's observe what's in the about section
  // const [aboutAction] = await page.observe("Look at the about section on the right side of the page");
  // await drawObserveOverlay(page, [aboutAction]);
  // await page.waitForTimeout(2000);
  // await clearOverlays(page);

  // Extract the link from the about section dynamically
  const { aboutLink } = await page.extract({
    instruction: "extract the website URL from the about section on the right side (it should include vercel.app within the URL)",
    schema: z.object({
      aboutLink: z.string(),
    }),
  });

  console.log(`Found link in about section: ${aboutLink}`);

  // Navigate to the extracted link (ensuring it has proper protocol)
  const fullUrl = aboutLink.startsWith('http') ? aboutLink : `https://${aboutLink}`;
  await page.goto(fullUrl);

  // Extract the about section from the page
  const { aboutSection } = await page.extract({
    instruction: "extract the about section content from this page",
    schema: z.object({
      aboutSection: z.string(),
    }),
  });

  // Console.log the about section
  console.log(aboutSection);
  
  // // Navigate to a URL
  // await page.goto("https://docs.stagehand.dev/reference/introduction");

  // // Use act() to take actions on the page
  // await page.act("Click the search box");

  // // Use observe() to plan an action before doing it
  // const [action] = await page.observe(
  //   "Type 'Tell me in one sentence why I should use Stagehand' into the search box",
  // );
  // await drawObserveOverlay(page, [action]); // Highlight the search box
  // await page.waitForTimeout(1_000);
  // await clearOverlays(page); // Remove the highlight before typing
  // await page.act(action); // Take the action

  // // For more on caching, check out our docs: https://docs.stagehand.dev/examples/caching
  // await page.waitForTimeout(1_000);
  // await actWithCache(page, "Click the suggestion to use AI");
  // await page.waitForTimeout(5_000);

  // // Use extract() to extract structured data from the page
  // const { text } = await page.extract({
  //   instruction:
  //     "extract the text of the AI suggestion from the search results",
  //   schema: z.object({
  //     text: z.string(),
  //   }),
  // });
  // stagehand.log({
  //   category: "create-browser-app",
  //   message: `Got AI Suggestion`,
  //   auxiliary: {
  //     text: {
  //       value: text,
  //       type: "string",
  //     },
  //   },
  // });
  // stagehand.log({
  //   category: "create-browser-app",
  //   message: `Metrics`,
  //   auxiliary: {
  //     metrics: {
  //       value: JSON.stringify(stagehand.metrics),
  //       type: "object",
  //     },
  //   },
  // });
}

/**
 * This is the main function that runs when you do npm run start
 *
 * YOU PROBABLY DON'T NEED TO MODIFY ANYTHING BELOW THIS POINT!
 *
 */
async function run() {
  const stagehand = new Stagehand({
    ...StagehandConfig,
  });
  await stagehand.init();

  if (StagehandConfig.env === "BROWSERBASE" && stagehand.browserbaseSessionID) {
    console.log(
      boxen(
        `View this session live in your browser: \n${chalk.blue(
          `https://browserbase.com/sessions/${stagehand.browserbaseSessionID}`,
        )}`,
        {
          title: "Browserbase",
          padding: 1,
          margin: 3,
        },
      ),
    );
  }

  const page = stagehand.page;
  const context = stagehand.context;
  await main({
    page,
    context,
    stagehand,
  });
  await stagehand.close();
  console.log(
    `\n🤘 Thanks so much for using Stagehand! Reach out to us on Slack if you have any feedback: ${chalk.blue(
      "https://stagehand.dev/slack",
    )}\n`,
  );
}

run();

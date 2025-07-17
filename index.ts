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

  // Navigate to GoBEBA website
  await page.goto("https://gobeba.com/");
  
  // Click on the WATER card component
  await page.act("Click the WATER card component");
  
  // Wait for the page to load
  await page.waitForTimeout(2000);
  
  // Confirm that "Keringet Mineral Water Refill 20L (Refill Only)" exists
  const productExists = await page.extract({
    instruction: "Check if 'Keringet Mineral Water Refill 20L (Refill Only)' product exists on the page",
    schema: z.object({
      exists: z.boolean(),
      productName: z.string().optional(),
    }),
  });
  
  if (!productExists.exists) {
    throw new Error("Keringet Mineral Water Refill 20L (Refill Only) product not found on the page");
  }
  
  console.log("✅ Confirmed: Keringet Mineral Water Refill 20L (Refill Only) exists");
  
  // Confirm the price is "Ksh 595"
  const priceInfo = await page.extract({
    instruction: "Extract the price for 'Keringet Mineral Water Refill 20L (Refill Only)'",
    schema: z.object({
      price: z.string(),
    }),
  });
  
  if (!priceInfo.price.includes("595")) {
    throw new Error(`Expected price Ksh 595, but found: ${priceInfo.price}`);
  }
  
  console.log("✅ Confirmed: Price is Ksh 595");
  
  // Click on the "ADD TO CART" button for the Keringet Mineral Water product
  await page.act("Click the ADD TO CART button for Keringet Mineral Water Refill 20L (Refill Only)");
  
  // Wait to see the "View cart" link appear
  await page.waitForTimeout(2000);
  
  // Check if "View cart" link is visible
  const viewCartExists = await page.extract({
    instruction: "Check if 'View cart' link is visible on the page",
    schema: z.object({
      exists: z.boolean(),
    }),
  });
  
  if (!viewCartExists.exists) {
    throw new Error("View cart link not found after adding item to cart");
  }
  
  console.log("✅ Confirmed: View cart link appeared");
  
  // Click on "View cart" to go to cart page
  await page.act("Click the View cart link");
  
  // Wait for the cart page to load
  await page.waitForTimeout(2000);
  
  // Confirm cart details
  const cartDetails = await page.extract({
    instruction: "Extract cart details including product name, price, quantity, delivery cost, and total",
    schema: z.object({
      productName: z.string(),
      productPrice: z.string(),
      quantity: z.string(),
      deliveryPrice: z.string(),
      total: z.string(),
    }),
  });
  
  // Validate cart details
  const validations = [
    {
      condition: cartDetails.productName.includes("Keringet Mineral Water Refill 20L"),
      message: "Product name matches"
    },
    {
      condition: cartDetails.productPrice.includes("595"),
      message: "Product price is 595"
    },
    {
      condition: cartDetails.quantity.includes("1"),
      message: "Quantity is 1"
    },
    {
      condition: cartDetails.deliveryPrice.includes("200"),
      message: "Delivery cost is Ksh 200"
    },
    {
      condition: cartDetails.total.includes("795"),
      message: "Total is Ksh 795"
    }
  ];
  
  validations.forEach(({ condition, message }) => {
    if (!condition) {
      throw new Error(`Validation failed: ${message}`);
    }
    console.log(`✅ Confirmed: ${message}`);
  });
  
  // Take a screenshot and save to desktop. Change the path to your desktop path
  const desktopPath = "/path/to/desktop/gobeba-cart-screenshot.png";
  await page.screenshot({ path: desktopPath, fullPage: true });
  
  console.log(`📸 Screenshot saved to: ${desktopPath}`);
  
  // Log success message
  stagehand.log({
    category: "gobeba-water-order",
    message: "Successfully completed GoBEBA water ordering test",
    auxiliary: {
      cartDetails: {
        value: JSON.stringify(cartDetails),
        type: "object",
      },
    },
  });
  
  console.log("🎉 All validations passed! GoBEBA water ordering test completed successfully.");
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

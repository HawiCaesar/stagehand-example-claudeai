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

  // Navigate to KRA Portal
  console.log("🌐 Navigating to KRA Portal...");
  
  try {
    await page.goto("https://itax.kra.go.ke/KRA-Portal", { timeout: 30000 });
    console.log("✅ KRA Portal is reachable");
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Click on the input field labelled "Enter PIN/User ID"
    console.log("🔍 Looking for PIN/User ID input field...");
    await page.act("Click on the input field labelled 'Enter PIN/User ID'");
    
    // Enter the KRA Pin from environment variable
    const kraPin = process.env.KRA_PIN;
    if (!kraPin) {
      throw new Error("KRA_PIN not found in environment variables");
    }
    
    console.log("📝 Entering KRA PIN...");
    await page.act(`Type '${kraPin}' into the PIN/User ID input field`);
    
    // Click on "Continue"
    console.log("⏭️ Clicking Continue...");
    await page.act("Click the Continue button");
    
    // Wait for password page to load
    await page.waitForTimeout(2000);
    
    // Enter the KRA password from environment variable
    const kraPassword = process.env.KRA_PASSWORD;
    if (!kraPassword) {
      throw new Error("KRA_PASSWORD not found in environment variables");
    }
    
    console.log("🔐 Entering KRA Password...");
    await page.act(`Type '${kraPassword}' into the password input field`);
    
    // Extract the arithmetic problem from "Security Stamp" field
    console.log("🧮 Solving arithmetic Security Stamp...");
    const securityStamp = await page.extract({
      instruction: "Extract the arithmetic problem from the Security Stamp field",
      schema: z.object({
        problem: z.string(),
      }),
    });
    
    // Simple arithmetic solver for basic operations
    const solveArithmetic = (problem: string): number => {
      // Remove any extra spaces and clean the problem
      const cleanProblem = problem.replace(/\s+/g, '').trim();
      
      // Handle basic arithmetic operations
      if (cleanProblem.includes('+')) {
        const [a, b] = cleanProblem.split('+').map(x => parseInt(x.trim()));
        return a + b;
      } else if (cleanProblem.includes('-')) {
        const [a, b] = cleanProblem.split('-').map(x => parseInt(x.trim()));
        return a - b;
      } else if (cleanProblem.includes('*') || cleanProblem.includes('×')) {
        const [a, b] = cleanProblem.split(/[*×]/).map(x => parseInt(x.trim()));
        return a * b;
      } else if (cleanProblem.includes('/') || cleanProblem.includes('÷')) {
        const [a, b] = cleanProblem.split(/[/÷]/).map(x => parseInt(x.trim()));
        return Math.floor(a / b);
      }
      
      // If no operation found, try to evaluate as a simple expression
      try {
        return eval(cleanProblem);
      } catch (error) {
        throw new Error(`Cannot solve arithmetic problem: ${problem}`);
      }
    };
    
    const answer = solveArithmetic(securityStamp.problem);
    console.log(`🔢 Solved: ${securityStamp.problem} = ${answer}`);
    
    // Enter the answer in the Security Stamp input field
    await page.act(`Type '${answer}' into the Security Stamp input field`);
    
    // Click "Login"
    console.log("🔑 Clicking Login...");
    await page.act("Click the Login button");
    
    // Wait for login to complete
    await page.waitForTimeout(5000);
    
    // Check if login was successful by looking for dashboard elements
    const loginSuccess = await page.extract({
      instruction: "Check if login was successful by looking for dashboard or main menu elements",
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
    });
    
    if (loginSuccess.success) {
      console.log("✅ Login successful! Accessing KRA dashboard...");
      
      // Navigate to payments section for April consultation
      console.log("💰 Looking for payments section...");
      await page.act("Click on payments or tax consultation section");
      
      // Wait for payments page to load
      await page.waitForTimeout(3000);
      
      // Look for April payments or set date filter to April
      console.log("📅 Setting date filter to April...");
      await page.act("Set date filter or select April for payment consultation");
      
      // Wait for results to load
      await page.waitForTimeout(3000);
      
      // Extract payment information for April
      const aprilPayments = await page.extract({
        instruction: "Extract April payment information including dates, amounts, and payment status",
        schema: z.object({
          payments: z.array(z.object({
            date: z.string(),
            amount: z.string(),
            status: z.string(),
            description: z.string(),
          })),
        }),
      });
      
      console.log("💳 April Payment Information:");
      aprilPayments.payments.forEach((payment, index) => {
        console.log(`  ${index + 1}. Date: ${payment.date}, Amount: ${payment.amount}, Status: ${payment.status}, Description: ${payment.description}`);
      });
      
      // Log to Stagehand
      stagehand.log({
        category: "kra-payment-consultation",
        message: "Successfully consulted April payments on KRA portal",
        auxiliary: {
          aprilPayments: {
            value: JSON.stringify(aprilPayments),
            type: "object",
          },
        },
      });
      
    } else {
      console.log("❌ Login failed:", loginSuccess.message);
    }
    
    // Take a screenshot and save to desktop
    const desktopPath = "/Users/brianhawi/Desktop/kra-portal-screenshot.png";
    await page.screenshot({ path: desktopPath, fullPage: true });
    console.log(`📸 Screenshot saved to: ${desktopPath}`);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log("❌ KRA Portal is not reachable or error occurred:", errorMessage);
    
    // Take a screenshot of the error and save to desktop
    const errorScreenshotPath = "/Users/brianhawi/Desktop/kra-portal-error-screenshot.png";
    await page.screenshot({ path: errorScreenshotPath, fullPage: true });
    console.log(`📸 Error screenshot saved to: ${errorScreenshotPath}`);
    
    // End the session
    console.log("🔚 Ending session due to portal unreachability or error");
    return;
  }
  
  console.log("🎉 KRA payment consultation completed successfully!");
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

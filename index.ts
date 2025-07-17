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
    
    // Extract the arithmetic problem from "Security Stamp" field using OCR
    console.log("🧮 Solving arithmetic Security Stamp (image-based)...");
    
    // Wait longer for the security stamp to fully load
    await page.waitForTimeout(2000);
    
    // Take a screenshot for debugging before extraction
    const beforeScreenshot = "/Users/brianhawi/Desktop/security-stamp-before.png";
    await page.screenshot({ path: beforeScreenshot, fullPage: true });
    console.log(`📸 Before screenshot saved to: ${beforeScreenshot}`);
    
    // First, observe the Security Stamp area to get its exact location
    const securityStampObservation = await page.observe("Find the Security Stamp section that contains the arithmetic problem with red numbers");
    console.log("🔍 Security Stamp Observation:", securityStampObservation.length, "elements found");
    
    // Try multiple extraction approaches to get the correct arithmetic
    let securityStampOCR: any;
    
    // Approach 1: Direct extraction with emphasis on the red numbers
    try {
      securityStampOCR = await page.extract({
        instruction: "Look at the page and find the Security Stamp area. In this area, there are red-colored numbers that form an arithmetic problem. The problem follows the format: [number] [operator] [number] ?. For example, if you see red numbers showing '99 + 13 ?', extract: firstNumber='99', operator='+', secondNumber='13'. Look carefully at the actual red numbers displayed on the page, not any placeholder text.",
        schema: z.object({
          firstNumber: z.string(),
          operator: z.string(),
          secondNumber: z.string(),
          fullProblem: z.string(),
        }),
      });
    } catch (error) {
      console.log("❌ First extraction failed, trying alternative...");
      
      // Approach 2: Focus on the visual elements near the Security Stamp label
      securityStampOCR = await page.extract({
        instruction: "Near the text 'Security Stamp' on the page, there is an arithmetic expression with red numbers. Look for two numbers separated by either '+' or '-' followed by '?'. Extract these exact numbers and the operator. Ignore any sample text - focus only on the actual red numbers shown.",
        schema: z.object({
          firstNumber: z.string(),
          operator: z.string(),
          secondNumber: z.string(),
          fullProblem: z.string(),
        }),
      });
    }
    
    // Log what was extracted for debugging
    console.log("🔍 OCR Extraction Results:");
    console.log(`   First Number: "${securityStampOCR.firstNumber}"`);
    console.log(`   Operator: "${securityStampOCR.operator}"`);
    console.log(`   Second Number: "${securityStampOCR.secondNumber}"`);
    console.log(`   Full Problem: "${securityStampOCR.fullProblem}"`);
    
    // Parse and solve the arithmetic problem
    const solveImageBasedArithmetic = (first: string, operator: string, second: string): number => {
      const num1 = parseInt(first.replace(/[^0-9]/g, ''));
      const num2 = parseInt(second.replace(/[^0-9]/g, ''));
      
      if (isNaN(num1) || isNaN(num2)) {
        throw new Error(`Invalid numbers extracted: ${first}, ${second}`);
      }
      
      switch (operator.trim()) {
        case '+':
          return num1 + num2;
        case '-':
          return num1 - num2;
        case '*':
        case '×':
          return num1 * num2;
        case '/':
        case '÷':
          return Math.floor(num1 / num2);
        default:
          throw new Error(`Unknown operator: ${operator}`);
      }
    };
    
    let answer: number;
    
    try {
      answer = solveImageBasedArithmetic(
        securityStampOCR.firstNumber,
        securityStampOCR.operator,
        securityStampOCR.secondNumber
      );
      
      console.log(`🔢 Solved: ${securityStampOCR.fullProblem} = ${answer}`);
      console.log(`   First: ${securityStampOCR.firstNumber}, Operator: ${securityStampOCR.operator}, Second: ${securityStampOCR.secondNumber}`);
      
    } catch (error) {
      console.log("❌ First OCR attempt failed, trying alternative approach...");
      
      // Take a screenshot for manual inspection
      const securityStampScreenshot = "/Users/brianhawi/Desktop/security-stamp-debug.png";
      await page.screenshot({ path: securityStampScreenshot, fullPage: true });
      console.log(`📸 Security stamp screenshot saved to: ${securityStampScreenshot}`);
      
      // Try a different extraction approach
      const alternativeOCR = await page.extract({
        instruction: "Find the Security Stamp area on the page. Look for red colored numbers that form an arithmetic expression. There should be two numbers with either a + or - sign between them, followed by a question mark. Extract each component separately.",
        schema: z.object({
          numbers: z.array(z.string()),
          operator: z.string(),
          expression: z.string(),
        }),
      });
      
      console.log("🔍 Alternative OCR Results:");
      console.log(`   Numbers: ${JSON.stringify(alternativeOCR.numbers)}`);
      console.log(`   Operator: "${alternativeOCR.operator}"`);
      console.log(`   Expression: "${alternativeOCR.expression}"`);
      
      if (alternativeOCR.numbers.length >= 2) {
        const num1 = parseInt(alternativeOCR.numbers[0].replace(/[^0-9]/g, ''));
        const num2 = parseInt(alternativeOCR.numbers[1].replace(/[^0-9]/g, ''));
        
        if (!isNaN(num1) && !isNaN(num2)) {
          answer = alternativeOCR.operator.includes('+') ? num1 + num2 : num1 - num2;
          console.log(`🔢 Alternative solve: ${num1} ${alternativeOCR.operator} ${num2} = ${answer}`);
        } else {
          throw new Error(`Could not parse numbers from alternative OCR: ${alternativeOCR.numbers}`);
        }
      } else {
        throw new Error(`Alternative OCR failed to extract sufficient numbers: ${alternativeOCR.numbers}`);
      }
    }
    
    // Enter the answer in the Security Stamp input field
    await page.act(`Type '${answer}' into the Security Stamp input field`);
    
    // Click "Login"
    console.log("🔑 Clicking Login...");
    await page.act("Click the Login button");
    
    // Wait for login to complete
    await page.waitForTimeout(2000);
    
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

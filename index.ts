import { Stagehand, Page, BrowserContext } from '@browserbasehq/stagehand';
import StagehandConfig from './stagehand.config.js';
import chalk from 'chalk';
import boxen from 'boxen';
import { drawObserveOverlay, clearOverlays, actWithCache } from './utils.js';
import { z } from 'zod';
import sharp from 'sharp';
import GoogleCloudVision from '@google-cloud/vision';

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
  stagehand
}: {
  page: Page; // Playwright Page with act, extract, and observe methods
  context: BrowserContext; // Playwright BrowserContext
  stagehand: Stagehand; // Stagehand instance
}) {
  console.log(chalk.blue('🚀 Starting KRA Portal Login Process'));

  const kraPin = process.env.KRA_PIN;
  const kraPassword = process.env.KRA_PASSWORD;
  const googleCloudVisionApiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;

  if (!kraPin || !kraPassword) {
    console.log(
      chalk.red(
        '❌ KRA_PIN and KRA_PASSWORD must be set in environment variables'
      )
    );
    await page.screenshot({
      path: '/Users/brianhawi/Desktop/error-missing-credentials.png',
      fullPage: true
    });
    return;
  }

  try {
    console.log(chalk.yellow('📍 Navigating to KRA Portal...'));
    await page.goto('https://itax.kra.go.ke/KRA-Portal', {
      waitUntil: 'networkidle'
    });

    // Check if portal is reachable by looking for key elements
    console.log(chalk.yellow('🔍 Checking if portal is reachable...'));
    await page.waitForLoadState('networkidle');

    // Look for the PIN/User ID input field to verify portal is working
    const pinInputAction = await page.observe(
      "Click on the input field labelled 'Enter PIN/User ID'"
    );

    if (pinInputAction && pinInputAction.length > 0) {
      console.log(
        chalk.green('✅ Portal is reachable, proceeding with login...')
      );

      // Step 1: Click on PIN/User ID input field
      console.log(chalk.yellow('📝 Entering KRA PIN...'));
      await page.act(pinInputAction[0]);
      await page.keyboard.type(kraPin);

      // Step 2: Click Continue
      console.log(chalk.yellow('⏭️ Clicking Continue...'));
      await page.act("Click on 'Continue'");

      // Wait for password field to appear
      await page.waitForTimeout(2000);

      // Step 3: Enter password
      console.log(chalk.yellow('🔐 Entering password...'));
      await page.act('Click on the password input field');
      await page.keyboard.type(kraPassword);

      // // Step 4: Handle Security Stamp (CAPTCHA)
      console.log(chalk.yellow('🔒 Handling Security Stamp...'));

      const captchaSrc = await page.getAttribute('img#captcha_img', 'src');
      console.log(chalk.blue(`📸 Captcha URL: ${captchaSrc}`));

      if (captchaSrc) {
        console.log(chalk.blue('🖼️ Found captcha image, processing...'));

        // Construct full URL for the captcha image
        const fullCaptchaUrl = captchaSrc.startsWith('http')
          ? captchaSrc
          : `https://itax.kra.go.ke${captchaSrc}`;

        console.log(chalk.blue(`📸 Captcha URL: ${fullCaptchaUrl}`));

        // Open captcha image in new tab
        const newPage = await context.newPage();
        await newPage.goto(fullCaptchaUrl);


        await newPage.waitForTimeout(3000);

        // Save the captcha image
        await newPage.screenshot({
          path: '/Users/brianhawi/Desktop/KRA-security-capture.png'
          //fullPage: true
        });

        await newPage.waitForTimeout(3000);

        const answer = await evaluateArithmetic();
        console.log(chalk.green(`🎯 Calculated answer: ${answer}`));

        if (Number.isNaN(answer)) {
          console.log(chalk.red('❌ Could not solve arithmetic'));
          await newPage.close();
          return;
        }

        const allPages = await context.pages(); // Get all open pages
        const previousPage = allPages[0]; // Assuming the first page is your "previous" tab
        await previousPage.bringToFront(); // Switch to the previous tab

        // await previousPage.waitForTimeout(1500);
        await allPages[1].close();

        const captchaText = await previousPage.locator(
          'input[name="captcahText"]'
        );
        console.log({ captchaText }, '######################');
        await captchaText.fill(answer.toString());

        await previousPage.screenshot({
          path: '/Users/brianhawi/Desktop/KRA-math-result-screenshot.png',
          fullPage: true
        });

        await previousPage.waitForTimeout(1500);

        await previousPage.getByRole('link', { name: 'Login' }).click();

        await previousPage.waitForTimeout(3000);

        await previousPage.screenshot({
          path: '/Users/brianhawi/Desktop/KRA-final-logged-in-screenshot.png',
          fullPage: true
        });

        await previousPage.waitForTimeout(3000);
      }

       console.log(chalk.green('✅ Login process completed'));
    } else {
      console.log(
        chalk.red('❌ Portal is not reachable - no PIN input field found')
      );
    }
  } catch (error) {
    console.log(chalk.red(`❌ Error during portal access: ${error}`));
  }

  // Always take a final screenshot
  console.log(chalk.yellow('📷 Taking final screenshot...'));
  // await page.screenshot({
  //   path: '/Users/brianhawi/Desktop/KRA-final-logged-in-screenshot.png',
  //   fullPage: true
  // });

  console.log(chalk.green('🎉 KRA login process completed'));
}

function sharpenImage() {
  // sharpen image
  const inputPath = '/Users/brianhawi/Desktop/KRA-security-capture.png';
  const outputPath =
    '/Users/brianhawi/Desktop/KRA-security-capture-resized.png';

  sharp(inputPath).resize(3274, 1832).sharpen().toFile(outputPath);
}

// Simple arithmetic evaluator for security stamp
async function evaluateArithmetic(): Promise<number> {
  // sharpen image
  sharpenImage();

  try {
    // Creates a client
    const client = new GoogleCloudVision.ImageAnnotatorClient();

    // Performs text detection on the image file
    const [result] = await client.textDetection(
      '/Users/brianhawi/Desktop/KRA-security-capture-resized.png'
    );
    const labels = result.textAnnotations;

    const mathOperationWithoutQuestionMark = labels?.[0]?.description
      ?.replace(/\?$|7$/, '')
      .trim();
    console.log(mathOperationWithoutQuestionMark, '**************');
    const mathOperationWithoutSpaces =
      mathOperationWithoutQuestionMark?.replace(/\s+/g, '');

    console.log(mathOperationWithoutSpaces, '######################');

    return parseInt(eval(mathOperationWithoutSpaces ?? 'NaN'));
  } catch (error) {
    console.log(chalk.red(`❌ Error during portal access: ${error}`));
    return NaN;
  }
}

/**
 * This is the main function that runs when you do npm run start
 *
 * YOU PROBABLY DON'T NEED TO MODIFY ANYTHING BELOW THIS POINT!
 *
 */
async function run() {
  const stagehand = new Stagehand({
    ...StagehandConfig
  });
  await stagehand.init();

  if (StagehandConfig.env === 'BROWSERBASE' && stagehand.browserbaseSessionID) {
    console.log(
      boxen(
        `View this session live in your browser: \n${chalk.blue(
          `https://browserbase.com/sessions/${stagehand.browserbaseSessionID}`
        )}`,
        {
          title: 'Browserbase',
          padding: 1,
          margin: 3
        }
      )
    );
  }

  const page = stagehand.page;
  const context = stagehand.context;
  await main({
    page,
    context,
    stagehand
  });
  await stagehand.close();
  console.log(
    `\n🤘 Thanks so much for using Stagehand! Reach out to us on Slack if you have any feedback: ${chalk.blue(
      'https://stagehand.dev/slack'
    )}\n`
  );
}

run();

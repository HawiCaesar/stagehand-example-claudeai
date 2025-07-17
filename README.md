# Experimenting browser automation with Stagehand
With this repo I am using branches. The README will include branches trying out various browser automation ideas, the prompt used eventually, and video showing it in action.

## The main branch
The main branch

### Prompt
Go to https://github.com/HawiCaesar/hawicaesar and in the about section on the right. 
The section should have a link that includes vercel.app
Go to the link that includes vercel.app and extract the about section of the page and console.log it

### Video in action
https://drive.google.com/file/d/1sFsNYgFx8XfWksmwp5Qu1sUpqAPrcWj-/view?usp=sharing

## feat/gobeba-order-water

### Prompt
- Go over to @https://gobeba.com/ 
- Click on the card component that is labelled "WATER"
- Wait for the page to load, say 2 seconds
- Confirm that "Keringet Mineral Water Refill 20L (Refill Only)" exists
- Confirm that the price is "Ksh 595"
- Click on the "ADD TO CART" button link for the "Keringet Mineral Water Refill 20L (Refill Only)" product
- Wait to see the "View cart" link after the "ADD TO CART" button link
- Wait for the page to load, say 2 seconds
- Confirm the following from the cart page
   1. 	Keringet Mineral Water Refill 20L (Refill Only) priced at 595 with 1 quantity only
   2. Delivery is Ksh 200
   3. The total is Ksh 795
- Take a screenshot and save if on my desktop

### Video in action
https://drive.google.com/file/d/1sFsNYgFx8XfWksmwp5Qu1sUpqAPrcWj-/view?usp=sharing

---------------
***************

## 🤘 Welcome to Stagehand!

Hey! This is a project built with [Stagehand](https://github.com/browserbase/stagehand).

You can build your own web agent using: `npx create-browser-app`!

## Setting the Stage

Stagehand is an SDK for automating browsers. It's built on top of [Playwright](https://playwright.dev/) and provides a higher-level API for better debugging and AI fail-safes.

## Curtain Call

Get ready for a show-stopping development experience. Just run:

```bash
npm install && npm start
```

## What's Next?

### Add your API keys

Required API keys/environment variables are in the `.env.example` file. Copy it to `.env` and add your API keys.

```bash
cp .env.example .env && nano .env # Add your API keys to .env
```

### Custom .cursorrules

We have custom .cursorrules for this project. It'll help quite a bit with writing Stagehand easily.

### Run on Browserbase

To run on Browserbase, add your API keys to .env and change `env: "LOCAL"` to `env: "BROWSERBASE"` in [stagehand.config.ts](stagehand.config.ts).

### Use Anthropic Claude 3.5 Sonnet

1. Add your API key to .env
2. Change `modelName: "gpt-4o"` to `modelName: "claude-3-5-sonnet-latest"` in [stagehand.config.ts](stagehand.config.ts)
3. Change `modelClientOptions: { apiKey: process.env.OPENAI_API_KEY }` to `modelClientOptions: { apiKey: process.env.ANTHROPIC_API_KEY }` in [stagehand.config.ts](stagehand.config.ts)

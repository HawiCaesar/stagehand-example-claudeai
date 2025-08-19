# Experimenting: Browser automation with Stagehand
A Stagehand playground repo. With this repo I am using branches. The README will include branches trying out various browser automation ideas, the prompt used eventually, and video showing it in action.

## 🎋 The main branch
The main branch

### Prompt
Go to https://github.com/HawiCaesar/hawicaesar and in the about section on the right. 
The section should have a link that includes vercel.app
Go to the link that includes vercel.app and extract the about section of the page and console.log it

### Video in action
https://drive.google.com/file/d/1sFsNYgFx8XfWksmwp5Qu1sUpqAPrcWj-/view?usp=sharing

## 🎋 feat/gobeba-order-water

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
- Take a screenshot and save it on my desktop

### Video in action
https://drive.google.com/file/d/196QiVcCZiJ8AMU21dZfP71qOgOFAU1SX/view?usp=sharing


## KRA login attempt. 
This was an example attempt to see if I could login "as a human" with browser automation tools.

This IS NOT AN ATTEMPT to brute force into the itax portal! BrowserBase provides anti-bot mechanisms and I was attempting to micmic human behaviour.

The goal at some point was to allow logging in and viewing payments my done.
Why?
I have worked remotely and I've paid taxes before and I was attempting to automate that section.
And probably in future allow tax professionals to run scripts automatically.

Used
- Google Vision API and Sharp to help solve the capture. 
- BrowserBase basic auto capture tools didnt work for me 🤷🏾‍♂️

### Prompt
- Go to https://itax.kra.go.ke/KRA-Portal
- If the portal is reachable then
    - click on the input field labelled "Enter PIN/User ID"
    - enter the KRA Pin found in the .env named KRA_PIN
    - click on "Continue"
    - enter the KRA password found in the .env file name KRA_PASSWORD
    Attempt solve the arthimetic field labelled "Security Stamp" and put the answer in the input field
    - first check the src url for the image tag with the ID captcha_img
    - append the image src url to https://itax.kra.go.ke/KRA-Portal/
    - navigate to it on a new tab.
    - Save the image as "KRA-security-capture"
    - Take a screenshot and save it on my desktop
- If the portal is not reachable
    - Take a screenshot and save it on my desktop
- Take a screenshot and save it on my desktop
- end the session

### Video in action (login in didnt work though 😅😂)
https://drive.google.com/file/d/1uJunx3qdXWrDQb_1Mtrb2AZmH3h7J8rc/view?usp=sharing

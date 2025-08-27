## 🎋 KRA Automation login attempt. feat/KRA-simple-login
This was an example attempt to see if I could login "as a human" with browser automation tools.

This **IS NOT AN ATTEMPT** to brute force into the itax portal! BrowserBase provides anti-bot mechanisms and I was attempting to micmic human behaviour.

The goal at some point was to allow logging in and viewing payments done.
Why?
I have worked remotely and I've paid taxes before and I was attempting to automate the logging in and consulting payments.
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
    - Attempt solve the arthimetic field labelled "Security Stamp" and put the answer in the input field
        - first check the src url for the image tag with the ID captcha_img
        - append the image src url to https://itax.kra.go.ke/KRA-Portal/
        - navigate to it on a new tab.
        - Save the image as "KRA-security-capture"
        - Solve the capture and put the answer in the input field
        - Click on the "Login" button
    - Take a screenshot and save it on my desktop
- If the portal is not reachable
    - Take a screenshot and save it on my desktop
- Take a screenshot and save it on my desktop
- end the session

### Video in action (login in didnt work though 😅😂)
https://drive.google.com/file/d/1uJunx3qdXWrDQb_1Mtrb2AZmH3h7J8rc/view?usp=sharing

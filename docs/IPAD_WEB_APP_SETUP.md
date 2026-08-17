# CoachIQ iPad setup

CoachIQ can run as a private Google Apps Script web app while continuing to use
the existing CoachIQ spreadsheet as its database.

## Before deploying

1. Merge and copy the web-app update into the bound Apps Script project.
2. Open the CoachIQ spreadsheet on a computer, refresh it, and select
   **CoachIQ → Launch CoachIQ** once. This records the spreadsheet ID for requests
   that arrive from the web app.
3. In the spreadsheet Share dialog, give every approved coach the spreadsheet
   access required for the actions they will perform. Keep the Staff directory
   emails and capabilities current inside CoachIQ.

## Create the private web app

1. Open **Extensions → Apps Script**.
2. Select **Deploy → New deployment**.
3. Choose **Web app** as the deployment type.
4. Set **Execute as** to **User accessing the web app** so CoachIQ can identify
   the signed-in coach and enforce the Staff directory.
5. Restrict **Who has access** to signed-in Google accounts in the program or
   school. Never enable anonymous public access.
6. Select **Deploy**, complete Google's authorization prompts, and copy the web
   app URL.

Google may use slightly different wording for access choices depending on the
account type. The required outcome is a signed-in, non-anonymous deployment that
runs as the coach opening it.

## Put CoachIQ on an iPad home screen

1. Open the spreadsheet on a computer and select **CoachIQ → Check iPad Web App**.
   Copy the exact deployed URL shown. It must end in `/exec`, not `/dev`.
2. Open that web app URL in Safari and sign in with the same email listed in the
   CoachIQ Staff directory.
3. Test Dashboard, Players, a practice session, and Live Game before game day.
4. Tap Safari's **Share** button.
5. Select **Add to Home Screen**.
6. Name it **CoachIQ** and select **Add**.

If an older Home Screen icon opens the wrong version, delete that icon, open the
verified `/exec` URL in Safari, and add it to the Home Screen again.

Open CoachIQ once while connected before each practice or game. Live Game tap
recovery protects interrupted taps on that device, but an internet connection is
still required to synchronize them to Google Sheets.

## Updating CoachIQ later

After changing Apps Script files, create a new deployment version through
**Deploy → Manage deployments → Edit → New version**. The iPad home-screen icon
continues to use the same deployment URL.

🌲 Wood Wallet — Testing & Development Guide

Welcome to the Wood Wallet website repository! This guide is written for testing the site, placing test orders, submitting reviews, and verifying backend integration with Google Sheets and Discord.

🚀 Quick Access

Live Site / GitHub Pages: https://<your-username>.github.io/<repo-name>/

Primary Pages:

index.html — Home page

specs.html — Product specifications (Weight: 83.31 g)

about.html — Brand background & mission (20% to autism research)

makers.html — Meet the makers

order.html — Checkout & order page

reviews.html — Customer review submission page

🧪 How to Test the Website

Follow these steps to test the site's main interactive features without spending real money.

1. Test Placing an Order (Admin Override)

To place an order without using real PayPal funds:

Open order.html in your browser.

Add #admin to the end of the URL in the address bar (e.g., https://.../order.html#admin) and hit Enter.

A hidden Admin Test Panel will appear at the bottom or inline on the order page.

Fill in the order form details:

Select a finish (Walnut, Golden Birch, or Ebony Timber).

Enter your name and shipping address.

In the Admin Password field, enter: Jude

Click Place Test Order.

Expected Result:

You will receive a unique Order ID on screen (formatted like WW-XXXXXXXX).

Copy and save this Order ID for the next test!

2. Verify Discord Notifications

Open the connected Discord channel where webhooks are routed.

Check if a new notification arrived for the order you just placed.

Expected Result:

A notification should appear marked with TEST.

Details should match the name, address, and finish selected during your test.

3. Test One-Time Customer Reviews

Navigate to reviews.html.

Enter the Order ID you generated during Step 1 (e.g., WW-3F9A1C20).

Write a test rating and review comment, then submit.

Expected Result:

The review should be accepted and sent for admin approval.

Re-testing Prevention Check:

Try submitting another review using the exact same Order ID.

Expected Result: The system should reject the second attempt, stating the Order ID has already been used.

4. Admin Review Approval (Google Sheets)

Open the connected Google Sheet backend.

Navigate to the Reviews tab.

Locate your test review.

Type TRUE in the Approved column.

Refresh reviews.html on the website.

Expected Result: Your review should now be publicly visible on the site.

📋 What Else to Check / UI Inspection Checklist

Please check the following items across different devices (Mobile and Desktop):

[ ] Branding: Verify the name says Wood Wallet everywhere (titles, headers, footers, copyright).

[ ] Weight: Check specs.html to confirm product weight is listed as 83.31 g.

[ ] Finish Names: Confirm Ebony Timber, Walnut, and Golden Birch options are spelled correctly.

[ ] Mobile Layout: Ensure images and buttons align well on mobile screens.

[ ] Links: Test navigation links between all pages to ensure no 404 errors.

⚙️ Backend Setup (For Maintainers)

The backend is powered by Google Apps Script connected to a Google Sheet.

Required Script Properties (in Apps Script):

PAYPAL_CLIENT_ID — Live or Sandbox Client ID from PayPal Developer Dashboard.

PAYPAL_SECRET — Client Secret from PayPal Developer Dashboard.

DISCORD_WEBHOOK — Discord Webhook URL for order alerts.

ADMIN_PASSWORD — Password used for #admin override (Jude).

⚠️ Security Note: Never commit PAYPAL_SECRET, Discord Webhooks, or plain-text passwords directly into frontend HTML/JS files repository.

🐛 Reporting Bugs

If you find a broken link, visual layout issue, or backend error, please let us know:

What page you were on.

What browser/device you used (e.g., Chrome on iPhone, Firefox on PC).

A screenshot or exact error message shown.

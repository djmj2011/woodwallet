// Cloudflare Worker: PayPal "payment completed" webhook -> Discord message.
// Secrets to set in Cloudflare (never put these in your website files):
//   PAYPAL_CLIENT_ID, PAYPAL_SECRET, PAYPAL_WEBHOOK_ID
// PRIVATE FILE: contains your Discord webhook. Do NOT upload to GitHub or your website.
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1565035505052024952/mP1ZCr5J-buX1zqoRls7Rr6WBdNidLLvPPJiNvkAexqkjz6yniXbpqaGxf9p_GVEwcGz";

const PP = "https://api-m.paypal.com"; // live. For testing use https://api-m.sandbox.paypal.com

async function getToken(env) {
  const r = await fetch(PP + "/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(env.PAYPAL_CLIENT_ID + ":" + env.PAYPAL_SECRET),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  return (await r.json()).access_token;
}

export default {
  async fetch(req, env) {
    if (req.method !== "POST") return new Response("TimberVault order webhook");

    const event = JSON.parse(await req.text());
    const token = await getToken(env);
    const auth = { Authorization: "Bearer " + token, "Content-Type": "application/json" };

    // 1. Confirm the request really came from PayPal
    const verify = await fetch(PP + "/v1/notifications/verify-webhook-signature", {
      method: "POST",
      headers: auth,
      body: JSON.stringify({
        auth_algo: req.headers.get("paypal-auth-algo"),
        cert_url: req.headers.get("paypal-cert-url"),
        transmission_id: req.headers.get("paypal-transmission-id"),
        transmission_sig: req.headers.get("paypal-transmission-sig"),
        transmission_time: req.headers.get("paypal-transmission-time"),
        webhook_id: env.PAYPAL_WEBHOOK_ID,
        webhook_event: event,
      }),
    });
    if ((await verify.json()).verification_status !== "SUCCESS") {
      return new Response("Invalid signature", { status: 400 });
    }
    if (event.event_type !== "PAYMENT.CAPTURE.COMPLETED") return new Response("Ignored");

    // 2. Look up the full order (item, buyer, shipping address)
    const cap = event.resource;
    const orderId = cap.supplementary_data?.related_ids?.order_id;
    let order = {};
    if (orderId) {
      order = await (await fetch(PP + "/v2/checkout/orders/" + orderId, { headers: auth })).json();
    }
    const unit = order.purchase_units?.[0] || {};
    const item = unit.items?.[0]?.name || unit.description || "TimberVault wallet";
    const buyer = order.payer?.name
      ? order.payer.name.given_name + " " + order.payer.name.surname
      : "Unknown";
    const a = unit.shipping?.address || {};
    const address = [a.address_line_1, a.address_line_2, a.admin_area_2, a.admin_area_1, a.postal_code, a.country_code]
      .filter(Boolean).join(", ") || "Not provided";

    // 3. Send it to Discord
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{
          title: "New TimberVault order",
          color: 0xc8803a,
          fields: [
            { name: "Item", value: item },
            { name: "Amount", value: cap.amount.value + " " + cap.amount.currency_code, inline: true },
            { name: "Buyer", value: buyer, inline: true },
            { name: "Email", value: order.payer?.email_address || "Not provided" },
            { name: "Ship to", value: address },
            { name: "PayPal order", value: orderId || cap.id },
          ],
          timestamp: new Date().toISOString(),
        }],
      }),
    });
    return new Response("OK");
  },
};

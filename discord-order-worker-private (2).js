// Cloudflare Worker for TimberVault. It does two jobs:
//  1. Receives the order form from your website and posts it to Discord.
//  2. Receives PayPal's "payment completed" webhook and posts it to Discord.
// Secrets to set in Cloudflare (never put these in your website files):
//   PAYPAL_CLIENT_ID, PAYPAL_SECRET, PAYPAL_WEBHOOK_ID

// The address your website is served from (no trailing slash).
const ALLOWED_ORIGIN = "https://YOUR-USERNAME.github.io";
const PP = "https://api-m.paypal.com"; // live. For testing use https://api-m.sandbox.paypal.com

// PRIVATE FILE: contains your Discord webhook. Do NOT upload to GitHub or your website.
function webhookUrl(env) { return "https://discord.com/api/webhooks/1565035505052024952/mP1ZCr5J-buX1zqoRls7Rr6WBdNidLLvPPJiNvkAexqkjz6yniXbpqaGxf9p_GVEwcGz"; }

const cors = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const clip = (s, n) => String(s || "").trim().slice(0, n);

async function sendDiscord(env, embed) {
  await fetch(webhookUrl(env), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ allowed_mentions: { parse: [] }, embeds: [embed] }),
  });
}

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

// ---- Job 1: order form from the website ----
async function handleForm(req, env) {
  const origin = req.headers.get("Origin");
  if (origin !== ALLOWED_ORIGIN) return new Response("Forbidden", { status: 403 });

  let d;
  try { d = await req.json(); } catch { return new Response("Bad request", { status: 400, headers: cors }); }
  if (d.website) return new Response("OK", { headers: cors }); // honeypot: bots fill this in

  const name = clip(d.name, 100), email = clip(d.email, 150);
  const street = clip(d.street, 150), city = clip(d.city, 80), region = clip(d.region, 80);
  const postal = clip(d.postal, 20), country = clip(d.country, 60);
  if (!name || !street || !city || !postal || !country || !/^\S+@\S+\.\S+$/.test(email)) {
    return new Response("Missing or invalid fields", { status: 400, headers: cors });
  }

  await sendDiscord(env, {
    title: "New order request (not paid yet)",
    color: 0x5865f2,
    fields: [
      { name: "Finish", value: clip(d.finishName, 60) || "Not given" },
      { name: "Name", value: name, inline: true },
      { name: "Email", value: email, inline: true },
      { name: "Ship to", value: [street, city, region, postal, country].filter(Boolean).join(", ") },
      { name: "Notes", value: clip(d.notes, 500) || "None" },
    ],
    timestamp: new Date().toISOString(),
  });
  return new Response("OK", { headers: cors });
}

// ---- Job 2: PayPal payment webhook ----
async function handlePayPal(req, env) {
  const event = JSON.parse(await req.text());
  const token = await getToken(env);
  const auth = { Authorization: "Bearer " + token, "Content-Type": "application/json" };

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
  if ((await verify.json()).verification_status !== "SUCCESS") return new Response("Invalid signature", { status: 400 });
  if (event.event_type !== "PAYMENT.CAPTURE.COMPLETED") return new Response("Ignored");

  const cap = event.resource;
  const orderId = cap.supplementary_data?.related_ids?.order_id;
  let order = {};
  if (orderId) order = await (await fetch(PP + "/v2/checkout/orders/" + orderId, { headers: auth })).json();
  const unit = order.purchase_units?.[0] || {};
  const item = unit.items?.[0]?.name || unit.description || "TimberVault wallet";
  const buyer = order.payer?.name ? order.payer.name.given_name + " " + order.payer.name.surname : "Unknown";
  const a = unit.shipping?.address || {};
  const address = [a.address_line_1, a.address_line_2, a.admin_area_2, a.admin_area_1, a.postal_code, a.country_code]
    .filter(Boolean).join(", ") || "Not provided";

  await sendDiscord(env, {
    title: "PAID: new TimberVault order",
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
  });
  return new Response("OK");
}

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    if (req.method !== "POST") return new Response("TimberVault order service");
    if (req.headers.get("paypal-transmission-id")) return handlePayPal(req, env);
    return handleForm(req, env);
  },
};

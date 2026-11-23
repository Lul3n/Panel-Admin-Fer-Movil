// Fer Movil push worker (Cloudflare free plan). The panel calls it after publishing,
// it checks the caller is an admin and sends the notice to its topic.
// The service account key is only in Cloudflare (SERVICE_ACCOUNT secret)

const PROJECT_ID = "fer-movil";
const TOPICS = ["general", "scholars", "applicants"];
const ALLOWED_ORIGINS = [
  "https://fer-movil.web.app",
  "https://fer-movil.firebaseapp.com",
  "http://localhost:5173",
];

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request.headers.get("Origin"));
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return reply({ error: "Method not allowed" }, 405, cors);

    try {
      const idToken = (request.headers.get("Authorization") || "").replace("Bearer ", "");
      const uid = await verifyIdToken(idToken);

      const body = await request.json().catch(() => ({}));
      const notificationId = String(body.notificationId || "");
      if (!/^[A-Za-z0-9]{1,64}$/.test(notificationId)) {
        return reply({ error: "Bad notificationId" }, 400, cors);
      }

      const accessToken = await getAccessToken(JSON.parse(env.SERVICE_ACCOUNT));

      // same as the rules: must have a doc in admins
      const admin = await getDocument(accessToken, `admins/${uid}`);
      if (!admin) return reply({ error: "Not an admin" }, 403, cors);

      // text comes from Firestore, not the request, so nobody can send random pushes
      const notification = await getDocument(accessToken, `notifications/${notificationId}`);
      if (!notification) return reply({ error: "Notification not found" }, 404, cors);
      if (!TOPICS.includes(notification.target)) return reply({ error: "Bad target" }, 400, cors);

      await sendToTopic(accessToken, notificationId, notification);
      return reply({ ok: true }, 200, cors);
    } catch (e) {
      return reply({ error: e.message }, e.status || 500, cors);
    }
  },
};

//Firebase ID token (who is calling)

let googleKeys = null;
let googleKeysExpire = 0;

async function getGoogleKeys() {
  if (googleKeys && Date.now() < googleKeysExpire) return googleKeys;
  const res = await fetch(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
  );
  googleKeys = (await res.json()).keys;
  googleKeysExpire = Date.now() + 60 * 60 * 1000; // 1 hour
  return googleKeys;
}

export async function verifyIdToken(token, keys = null) {
  const parts = token.split(".");
  if (parts.length !== 3) throw httpError(401, "Missing token");
  const [headerPart, payloadPart, signaturePart] = parts;
  const header = JSON.parse(textFromBase64Url(headerPart));
  const payload = JSON.parse(textFromBase64Url(payloadPart));
  const now = Math.floor(Date.now() / 1000);

  if (header.alg !== "RS256") throw httpError(401, "Bad token");
  if (payload.aud !== PROJECT_ID) throw httpError(401, "Bad token");
  if (payload.iss !== `https://securetoken.google.com/${PROJECT_ID}`) throw httpError(401, "Bad token");
  if (!payload.exp || payload.exp < now) throw httpError(401, "Token expired");
  if (!payload.sub) throw httpError(401, "Bad token");

  const jwk = (keys || (await getGoogleKeys())).find((k) => k.kid === header.kid);
  if (!jwk) throw httpError(401, "Bad token");
  const key = await crypto.subtle.importKey(
    "jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]
  );
  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5", key, bytesFromBase64Url(signaturePart),
    new TextEncoder().encode(`${headerPart}.${payloadPart}`)
  );
  if (!valid) throw httpError(401, "Bad token");
  return payload.sub;
}

//Google access token (from the service account)

let cachedToken = null;
let cachedTokenExpire = 0;

export async function signServiceAccountJwt(serviceAccount, now) {
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${base64UrlFromText(JSON.stringify(header))}.${base64UrlFromText(JSON.stringify(claims))}`;
  const key = await crypto.subtle.importKey(
    "pkcs8", bytesFromPem(serviceAccount.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]
  );
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  return `${unsigned}.${base64UrlFromBytes(new Uint8Array(signature))}`;
}

async function getAccessToken(serviceAccount) {
  if (cachedToken && Date.now() < cachedTokenExpire) return cachedToken;
  const jwt = await signServiceAccountJwt(serviceAccount, Math.floor(Date.now() / 1000));
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  const data = await res.json();
  if (!res.ok) throw httpError(500, "Could not get Google token");
  cachedToken = data.access_token;
  cachedTokenExpire = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

//Firestore and FCM

// Doc as strings, null if it doesn't exist
async function getDocument(accessToken, path) {
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${path}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw httpError(500, "Could not read Firestore");
  const fields = (await res.json()).fields || {};
  const doc = {};
  for (const [name, value] of Object.entries(fields)) {
    doc[name] = value.stringValue ?? null;
  }
  return doc;
}

// data = extras in the app, so tapping opens the right screen
async function sendToTopic(accessToken, notificationId, notification) {
  const data = { notificationId };
  if (notification.publicationId) data.publicationId = notification.publicationId;
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: {
        topic: notification.target,
        notification: { title: notification.title, body: notification.message },
        data,
        android: { priority: "high" },
      },
    }),
  });
  if (!res.ok) throw httpError(502, "FCM rejected the message");
}

//Helpers

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    Vary: "Origin",
  };
}

function reply(body, status, cors) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

function bytesFromBase64Url(text) {
  const base64 = text.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

function textFromBase64Url(text) {
  return new TextDecoder().decode(bytesFromBase64Url(text));
}

function base64UrlFromBytes(bytes) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlFromText(text) {
  return base64UrlFromBytes(new TextEncoder().encode(text));
}

function bytesFromPem(pem) {
  const base64 = pem.replace(/-----[A-Z ]+-----/g, "").replace(/\s/g, "");
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

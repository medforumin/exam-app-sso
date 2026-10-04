const { setGlobalOptions } = require("firebase-functions");
const { onUserCreated } = require("firebase-functions/v2/identity");
const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");

admin.initializeApp();

// Set default region to Mumbai (asia-south1)
setGlobalOptions({ region: "asia-south1" });

const WP_SITE_URL = "https://dnbpedia.in";
const PYQ_SECRET = "ihQt_9taH_L9B4_gTys_kfT2_gAxn";

// Triggers 100% guaranteed on every Firebase Auth registration
exports.createWordPressUserOnRegister = onUserCreated(async (event) => {
  const user = event.data;
  if (!user || !user.email) {
    console.log("[WPSync] User registered without email, skipping WordPress sync.");
    return;
  }

  const email = user.email;
  const username = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_");

  // Pause 1.5 seconds to allow client setDoc to complete
  await new Promise((resolve) => setTimeout(resolve, 1500));

  let name = "";

  // 1. Try reading from named Firestore DB 'default' (matching client app: db = getFirestore(app, "default"))
  try {
    const dbNamed = getFirestore("default");
    const userDoc = await dbNamed.doc(`users/${user.uid}`).get();
    if (userDoc.exists && userDoc.data() && userDoc.data().name) {
      name = userDoc.data().name;
      console.log(`[WPSync] Retrieved name "${name}" from named Firestore db 'default' users/${user.uid}`);
    }
  } catch (fsErr) {
    console.warn("[WPSync] Could not fetch from named Firestore db 'default':", fsErr.message);
  }

  // 2. Fallback: Try reading from standard default Firestore DB '(default)'
  if (!name) {
    try {
      const dbDefault = getFirestore();
      const userDoc = await dbDefault.doc(`users/${user.uid}`).get();
      if (userDoc.exists && userDoc.data() && userDoc.data().name) {
        name = userDoc.data().name;
        console.log(`[WPSync] Retrieved name "${name}" from default Firestore db users/${user.uid}`);
      }
    } catch (fsErr2) {
      console.warn("[WPSync] Could not fetch from default Firestore db:", fsErr2.message);
    }
  }

  // 3. Fallback: Try reading fresh displayName from Firebase Auth Admin SDK
  if (!name) {
    try {
      const freshAuthUser = await admin.auth().getUser(user.uid);
      if (freshAuthUser && freshAuthUser.displayName) {
        name = freshAuthUser.displayName;
        console.log(`[WPSync] Retrieved updated Auth displayName "${name}" for ${email}`);
      }
    } catch (authErr) {
      console.warn("[WPSync] Could not fetch fresh Auth user:", authErr.message);
    }
  }

  // 4. Fallback to email prefix if still empty
  if (!name) {
    name = email.split("@")[0];
  }

  console.log(`[WPSync] Syncing Auth User -> Email: ${email}, Name: ${name}, Username: ${username}`);

  try {
    const endpoint = `${WP_SITE_URL}/wp-json/pyq/v1/server-create-user`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-PYQ-Secret": PYQ_SECRET,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      body: JSON.stringify({
        username: username,
        email: email,
        name: name,
      }),
    });

    const responseText = await response.text();
    let result = null;
    try {
      result = JSON.parse(responseText);
    } catch {
      console.error(`[WPSync] WordPress returned HTML response (HTTP ${response.status}) instead of JSON:`, responseText.slice(0, 300));
      return;
    }

    console.log(`[WPSync] WordPress REST API Response (HTTP ${response.status}):`, JSON.stringify(result));

    if (response.ok && result.success) {
      console.log(`[WPSync] Successfully created/synced WP Subscriber user for ${email} with name "${name}"`);
    } else {
      console.error(`[WPSync] Failed to create/sync WordPress user (${response.status}):`, result);
    }
  } catch (error) {
    console.error("[WPSync] Network error connecting to WordPress:", error);
  }
});

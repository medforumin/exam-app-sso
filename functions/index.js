const { setGlobalOptions } = require("firebase-functions");
const { onUserCreated } = require("firebase-functions/v2/identity");
const { onRequest } = require("firebase-functions/v2/https");
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
        uid: user.uid,
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

/**
 * HTTP Cloud Function: Receives PMPro GOLD upgrade callbacks from WordPress.
 * Handles existing app users as well as auto-provisioning direct WordPress GOLD buyers.
 */
exports.syncGoldStatusFromWP = onRequest({ region: "asia-south1" }, async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Verify Secret Header
  const secret = req.headers["x-pyq-secret"];
  if (secret !== PYQ_SECRET) {
    return res.status(403).json({ error: "Unauthorized request" });
  }

  const { uid, email, name, role, goldStart, goldExpiry, planTitle, orderId, amount, levelId } = req.body;

  if (!email && !uid) {
    return res.status(400).json({ error: "Missing required identifier (uid or email)" });
  }

  try {
    let targetUid = uid;
    let isAutoProvisioned = false;

    // 1. Find Auth user by UID first if provided
    if (targetUid) {
      try {
        await admin.auth().getUser(targetUid);
      } catch {
        targetUid = null;
      }
    }

    // 2. Find Auth user by Email if UID not found or not provided
    if (!targetUid && email) {
      try {
        const authUser = await admin.auth().getUserByEmail(email);
        targetUid = authUser.uid;
      } catch {
        // User does not exist in Firebase Auth yet (Direct WP purchase)
        targetUid = null;
      }
    }

    // 3. Auto-provision Firebase Auth user if non-existent (Direct WP GOLD Buyer)
    if (!targetUid && email) {
      console.log(`[GoldSync] Auto-provisioning new Firebase Auth user for direct WP buyer ${email}`);
      const newAuthUser = await admin.auth().createUser({
        email: email,
        displayName: name || email.split("@")[0],
        emailVerified: true,
      });
      targetUid = newAuthUser.uid;
      isAutoProvisioned = true;
    }

    if (!targetUid) {
      return res.status(400).json({ error: "Unable to process or provision user account" });
    }

    const nowIso = new Date().toISOString();

    // If role requested is 'standard' (e.g. cancelled or reverted to free in PMPro)
    if (role === "standard") {
      const downgradeData = {
        role: "standard",
        goldLastUpdatedAt: nowIso,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      try {
        const dbNamed = getFirestore("default");
        await dbNamed.doc(`users/${targetUid}`).set(downgradeData, { merge: true });
      } catch (fsErr) {
        console.warn(`[GoldSync] Error updating named db for downgrade:`, fsErr.message);
      }

      try {
        const dbDefault = getFirestore();
        await dbDefault.doc(`users/${targetUid}`).set(downgradeData, { merge: true });
      } catch (fsErr2) {
        console.warn(`[GoldSync] Error updating default db for downgrade:`, fsErr2.message);
      }

      return res.status(200).json({
        success: true,
        uid: targetUid,
        role: "standard",
        message: `User ${targetUid} role set to standard`,
      });
    }

    // Role requested is 'gold' (Upgrade / Renewal flow)
    const startIso = goldStartAt || goldStart ? new Date(goldStartAt || goldStart).toISOString() : nowIso;

    const parsedMonths = Number(durationMonths) || (
      levelId === 3 ? 12 :
      levelId === 2 ? 6 :
      planTitle && planTitle.includes("12") ? 12 :
      planTitle && planTitle.includes("6") ? 6 :
      planTitle && planTitle.includes("1") ? 1 : 3
    );

    const chargeAmount = Number(amount || 0);

    let expiryIso = goldExpiry ? new Date(goldExpiry).toISOString() : null;
    if (!expiryIso || isNaN(new Date(expiryIso).getTime())) {
      const expDate = new Date(startIso);
      expDate.setMonth(expDate.getMonth() + parsedMonths);
      expiryIso = expDate.toISOString();
    }

    const paymentRecord = {
      id: `payment-${Date.now()}-${orderId || Math.random().toString(36).substring(2, 9)}`,
      userId: targetUid,
      amount: chargeAmount,
      months: parsedMonths,
      chargedAt: nowIso,
      transactionId: orderId ? `PMPro_${orderId}` : "PMPro_Checkout",
      note: planTitle || `WordPress PMPro Level ${levelId || 1}`,
    };

    let existingHistory = [];
    try {
      const dbNamed = getFirestore("default");
      const userSnap = await dbNamed.doc(`users/${targetUid}`).get();
      if (userSnap.exists && Array.isArray(userSnap.data().goldRevenueHistory)) {
        existingHistory = userSnap.data().goldRevenueHistory;
      }
    } catch (e) {
      // ignore
    }

    // Universal Canonical Membership Schema (No redundant duplicate fields)
    const goldData = {
      role: "gold",
      goldStartAt: startIso,
      goldExpiry: expiryIso,
      goldPlanMonths: parsedMonths,
      goldLastUpdatedAt: nowIso,
      lastGoldCharge: chargeAmount,
      goldRevenueHistory: [...existingHistory, paymentRecord],
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (isAutoProvisioned) {
      goldData.email = email;
      goldData.name = name || email.split("@")[0];
      goldData.createdVia = "WordPress_Direct_Purchase";
      goldData.createdAt = new Date().toISOString();
    }

    // Update named Firestore DB 'default'
    try {
      const dbNamed = getFirestore("default");
      await dbNamed.doc(`users/${targetUid}`).set(goldData, { merge: true });
      console.log(`[GoldSync] Updated named db 'default' users/${targetUid} with GOLD status (Expiry: ${goldExpiry})`);
    } catch (fsErr) {
      console.warn(`[GoldSync] Warning updating named db 'default':`, fsErr.message);
    }

    // Update standard default Firestore DB '(default)'
    try {
      const dbDefault = getFirestore();
      await dbDefault.doc(`users/${targetUid}`).set(goldData, { merge: true });
      console.log(`[GoldSync] Updated default db users/${targetUid} with GOLD status`);
    } catch (fsErr2) {
      console.warn(`[GoldSync] Warning updating default db:`, fsErr2.message);
    }

    return res.status(200).json({
      success: true,
      uid: targetUid,
      isNewUser: isAutoProvisioned,
      message: `User ${targetUid} upgraded to ${role || "Gold"} successfully`,
      goldExpiry: goldExpiry,
    });
  } catch (err) {
    console.error("[GoldSync] Error syncing GOLD status from WP:", err);
    return res.status(500).json({ error: err.message });
  }
});


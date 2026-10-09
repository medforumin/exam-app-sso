const { setGlobalOptions } = require("firebase-functions");
const { onUserCreated } = require("firebase-functions/v2/identity");
const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");

admin.initializeApp();

// Set default region to Mumbai (asia-south1)
setGlobalOptions({ region: "asia-south1" });

const WP_SITE_URL = "https://dnbpedia.in";
const PYQ_SECRET = "ihQt_9taH_L9B4_gTys_kfT2_gAxn";

const getDb = () => getFirestore("default");

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

  // 1. Try reading from named Firestore DB 'default' (matching client app)
  try {
    const dbNamed = getDb();
    const userDoc = await dbNamed.doc(`users/${user.uid}`).get();
    if (userDoc.exists && userDoc.data() && userDoc.data().name) {
      name = userDoc.data().name;
      console.log(`[WPSync] Retrieved name "${name}" from Firestore db 'default' users/${user.uid}`);
    }
  } catch (fsErr) {
    console.warn("[WPSync] Could not fetch from Firestore db 'default':", fsErr.message);
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

  const { uid, email, name, role, goldStart, goldStartAt, goldExpiry, planTitle, orderId, amount, levelId, durationMonths } = req.body;

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
        const db = getDb();
        await db.doc(`users/${targetUid}`).set(downgradeData, { merge: true });
        console.log(`[GoldSync] Successfully downgraded user ${targetUid} to standard role`);
      } catch (fsErr) {
        console.warn(`[GoldSync] Error updating db for downgrade:`, fsErr.message);
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

    let parsedMonths = Number(durationMonths) || 0;
    if (!parsedMonths || isNaN(parsedMonths)) {
      if (planTitle) {
        if (/\b(12|1\s*year|annual)\b/i.test(planTitle)) parsedMonths = 12;
        else if (/\b(6|6m)\b/i.test(planTitle)) parsedMonths = 6;
        else if (/\b(3|3m)\b/i.test(planTitle)) parsedMonths = 3;
        else if (/\b(1|1m)\b/i.test(planTitle)) parsedMonths = 1;
      }
      if (!parsedMonths) parsedMonths = levelId === 3 ? 12 : levelId === 2 ? 6 : 3;
    }

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
      const db = getDb();
      const userSnap = await db.doc(`users/${targetUid}`).get();
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

    // Update Firestore DB 'default'
    try {
      const db = getDb();
      await db.doc(`users/${targetUid}`).set(goldData, { merge: true });
      console.log(`[GoldSync] Updated Firestore db 'default' users/${targetUid} with GOLD status (Expiry: ${expiryIso})`);
    } catch (fsErr) {
      console.warn(`[GoldSync] Warning updating db 'default':`, fsErr.message);
    }

    // Trigger GOLD Welcome Email if notification system is active in systemConfig/emailSettings
    try {
      const dbForEmail = getDb();
      await sendGoldUpgradeEmailFromCloudFunction(dbForEmail, email, name, startIso, expiryIso, parsedMonths);
    } catch (eErr) {
      console.warn(`[GoldSync] Warning invoking upgrade email helper:`, eErr.message);
    }

    return res.status(200).json({
      success: true,
      uid: targetUid,
      isNewUser: isAutoProvisioned,
      message: `User ${targetUid} upgraded to ${role || "Gold"} successfully`,
      goldExpiry: expiryIso,
    });
  } catch (err) {
    console.error("[GoldSync] Error syncing GOLD status from WP:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Helper to dispatch Gold Upgrade Welcome email from Cloud Function
 */
async function sendGoldUpgradeEmailFromCloudFunction(db, recipientEmail, recipientName, startIso, expiryIso, parsedMonths) {
  if (!recipientEmail) return;

  try {
    const settingsSnap = await db.doc("systemConfig/emailSettings").get();
    if (!settingsSnap.exists) return;

    const settings = settingsSnap.data() || {};
    if (!settings.enabled) {
      console.log(`[Email System] Notification system is DEACTIVATED. Skipping upgrade email for ${recipientEmail}.`);
      return;
    }

    const templatesSnap = await db.doc("systemConfig/emailTemplates").get();
    let template = null;
    if (templatesSnap.exists && templatesSnap.data() && templatesSnap.data().gold_welcome) {
      template = templatesSnap.data().gold_welcome;
    }

    const defaultSubject = "[Pediatrics PYQ] Welcome to GOLD Membership!";
    const defaultBodyHtml = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #4f46e5, #d97706); padding: 24px; text-align: center; color: #ffffff;">
    <h1 style="margin: 0; font-size: 24px;">Welcome to GOLD Access!</h1>
    <p style="margin-top: 8px; opacity: 0.9; font-size: 14px;">Your subscription has been activated</p>
  </div>
  <div style="padding: 24px; color: #334155; line-height: 1.6;">
    <p>Dear <strong>{{userName}}</strong>,</p>
    <p>We are excited to let you know that your account has been upgraded to <strong>GOLD Membership</strong> for <strong>{{appTitle}}</strong>!</p>
    
    <div style="background: #f8fafc; border-left: 4px solid #d97706; padding: 16px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #92400e;">Subscription Details</h3>
      <p style="margin: 4px 0;"><strong>Plan Duration:</strong> {{planMonths}}</p>
      <p style="margin: 4px 0;"><strong>Start Date:</strong> {{goldStartAt}}</p>
      <p style="margin: 4px 0;"><strong>Expiration Date:</strong> {{expiryDate}}</p>
    </div>

    <p>You now have full access to high-yield past questions, explanations, and exclusive GOLD preparation material.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="https://pediatrics.medforum.in" style="background-color: #d97706; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Explore GOLD Content Now</a>
    </div>

    <p style="font-size: 13px; color: #64748b;">If you have any questions or need assistance, reply directly to this email or reach us at {{supportEmail}}.</p>
  </div>
  <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b;">
    © {{appTitle}} Team. All rights reserved.
  </div>
</div>`;

    const subjectRaw = template?.subject || defaultSubject;
    const bodyHtmlRaw = template?.bodyHtml || defaultBodyHtml;

    const startDateStr = new Date(startIso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    const expiryDateStr = new Date(expiryIso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    const safeName = recipientName || recipientEmail.split("@")[0];

    const vars = {
      userName: safeName,
      userEmail: recipientEmail,
      goldStartAt: startDateStr,
      expiryDate: expiryDateStr,
      planMonths: `${parsedMonths || 1} Month(s)`,
      appTitle: "Pediatrics PYQ",
      supportEmail: settings.replyTo || settings.fromEmail || "pediatrics@e.dnbpedia.in",
    };

    let renderedSubject = subjectRaw;
    let renderedHtml = bodyHtmlRaw;
    Object.keys(vars).forEach(key => {
      const val = vars[key] || "";
      renderedSubject = renderedSubject.split(`{{${key}}}`).join(val);
      renderedHtml = renderedHtml.split(`{{${key}}}`).join(val);
    });

    // Send via Apps Script Bridge if configured
    if (settings.useAppScriptBridge && settings.appScriptUrl) {
      await fetch(settings.appScriptUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "sendEmail",
          secretKey: settings.appScriptSecret || "PYQ_SECURE_KEY_2026",
          to: recipientEmail,
          subject: renderedSubject,
          htmlBody: renderedHtml,
          fromName: settings.fromName || "Pediatrics PYQ Admin",
          fromEmail: settings.fromEmail || "pediatrics@e.dnbpedia.in",
          replyTo: settings.replyTo || settings.fromEmail || "pediatrics@e.dnbpedia.in",
        }),
      });
      console.log(`[GoldSync Email] Dispatched GOLD welcome email to ${recipientEmail} via Apps Script Bridge.`);
    } else if (settings.customWebhookUrl) {
      await fetch(settings.customWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipientEmail,
          subject: renderedSubject,
          htmlBody: renderedHtml,
          fromName: settings.fromName || "Pediatrics PYQ Admin",
          fromEmail: settings.fromEmail || "pediatrics@e.dnbpedia.in",
          replyTo: settings.replyTo || settings.fromEmail || "pediatrics@e.dnbpedia.in",
        }),
      });
      console.log(`[GoldSync Email] Dispatched GOLD welcome email to ${recipientEmail} via Webhook.`);
    }
  } catch (emailErr) {
    console.error("[GoldSync Email Error] Failed to send upgrade email from Cloud Function:", emailErr.message);
  }
}

/**
 * Triggers automatically whenever a user submits a new UTR / Payment Request
 * Uses the emailService configuration stored in Firestore systemConfig/emailSettings
 */
exports.notifyAdminOnPendingUtr = onDocumentCreated(
  {
    document: "membership_requests/{requestId}",
    database: "default",
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const data = snap.data();
    if (!data) return;

    console.log(`[Admin UTR Notification] New request submitted by ${data.userEmail || data.userName} for UTR ${data.utrNumber}`);

    try {
      const db = getDb();
      const settingsSnap = await db.doc("systemConfig/emailSettings").get();
      if (!settingsSnap.exists) {
        console.warn("[Admin UTR Notification] emailSettings document missing in systemConfig.");
        return;
      }

      const settings = settingsSnap.data();
      if (!settings || !settings.enabled) {
        console.log("[Admin UTR Notification] Email notifications disabled in systemConfig/emailSettings.");
        return;
      }

      const adminRecipient = settings.adminNotificationEmail || settings.fromEmail || "pyq@dnbpedia.in";
      const subject = `[Payment Verification] New UTR ${data.utrNumber} submitted by ${data.userEmail || data.userName}`;

      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #d97706, #b45309); padding: 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 22px;">New Pending UTR Verification</h1>
            <p style="margin-top: 6px; font-size: 14px; opacity: 0.9;">PediaQ GOLD Membership Payment Request</p>
          </div>
          <div style="padding: 24px; color: #334155; line-height: 1.6;">
            <p>Hello Admin,</p>
            <p>A student has submitted their payment reference details for verification:</p>
            
            <div style="background: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #d97706; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 4px 0;"><strong>Student Name:</strong> ${data.userName || "N/A"}</p>
              <p style="margin: 4px 0;"><strong>Student Email:</strong> ${data.userEmail || "N/A"}</p>
              <p style="margin: 4px 0;"><strong>Plan Requested:</strong> ${data.planTitle || "Gold Membership"}</p>
              <p style="margin: 4px 0;"><strong>Amount Paid:</strong> ₹${data.amount}</p>
              <p style="margin: 4px 0;"><strong>Submitted UTR / Ref No:</strong> <span style="font-family: monospace; font-weight: bold; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${data.utrNumber}</span></p>
              <p style="margin: 4px 0;"><strong>Submitted At:</strong> ${new Date(data.createdAt || Date.now()).toLocaleString("en-IN")}</p>
            </div>

            <p style="font-size: 13px; color: #64748b;">Please log in to the PediaQ Admin Dashboard to verify and approve or decline this payment request.</p>
          </div>
          <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b;">
            © PediaQ Admin System • Automated Notification
          </div>
        </div>
      `;

      // 1. Apps Script Bridge
      if (settings.useAppScriptBridge && settings.appScriptUrl) {
        await fetch(settings.appScriptUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            action: "sendEmail",
            secretKey: settings.appScriptSecret || "PYQ_SECURE_KEY_2026",
            to: adminRecipient,
            subject: subject,
            htmlBody: htmlBody,
            fromName: settings.fromName || "PediaQ Payment System",
            fromEmail: settings.fromEmail || "pediatrics@e.dnbpedia.in",
            replyTo: data.userEmail || settings.fromEmail || "pediatrics@e.dnbpedia.in",
          }),
        });
        console.log(`[Admin UTR Notification] Admin alert sent to ${adminRecipient} via Apps Script Bridge.`);
      } else if (settings.customWebhookUrl) {
        await fetch(settings.customWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: adminRecipient,
            subject: subject,
            htmlBody: htmlBody,
            fromName: settings.fromName || "PediaQ Payment System",
            fromEmail: settings.fromEmail || "pediatrics@e.dnbpedia.in",
            replyTo: data.userEmail || settings.fromEmail || "pediatrics@e.dnbpedia.in",
          }),
        });
        console.log(`[Admin UTR Notification] Admin alert sent to ${adminRecipient} via Webhook.`);
      }
    } catch (err) {
      console.error("[Admin UTR Notification Error]:", err.message);
    }
  }
);


# DNBPedia PYQ App <-> WordPress User Sync & SSO Implementation Guide

## Executive Summary
This document serves as the complete technical specification and reference guide for the **User Auto-Provisioning** and **Single Sign-On (SSO)** system connecting the **PediaQ React & Android App** (`exam-app-in-united` / `pyq.dnbpedia.in`) with the **WordPress Site** (`https://dnbpedia.in` with Paid Memberships Pro).

---

## 1. System Architecture Overview

```
+-----------------------------------------------------------------------------------+
|                                  PYQ APP CLIENT                                   |
|                (React Web pyq.dnbpedia.in & Native Android App)                  |
+----------------------------------------+------------------------------------------+
                                         |
            [1] Auth Registration        | [2] Click link to dnbpedia.in
                                         |
                                         v
+----------------------------------------+------------------------------------------+
|                     1-Click SSO Token Generator                                   |
| - Intercepts dnbpedia.in links in App.jsx (ignores .png, .pdf, external links)    |
| - Displays loading toast: "Opening DNBPedia... Authenticating SSO"                |
| - Prevents duplicate clicks via isSSOInProgress lock                              |
| - Requests single-use 180s login token from /wp-json/pyq/v1/get-login-url        |
+----------------------------------------+------------------------------------------+
                                         |
                                         v
+----------------------------------------+------------------------------------------+
|                        WORDPRESS SITE (dnbpedia.in)                               |
|                  Plugin: dnbpedia-pyq-sync.php (v1.4)                             |
| - Validates single-use token pyq_sso_token                                       |
| - Calls wp_set_auth_cookie($user_id) with official wp-config.php secret salts      |
| - Redirects user logged-in seamlessly in Chrome/Safari                           |
| - Smart Name Parser: Splits First/Last Name & handles "Dr." / "Dr" titles          |
| - Updates PMPro fields: pmpro_bfirstname & pmpro_blastname                       |
| - Protects existing full display names from being overwritten                    |
+-----------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------+
|                        BACKGROUND SERVER-TO-SERVER SYNC                           |
| - Firebase Cloud Function v2: createWordPressUserOnRegister (asia-south1)         |
| - Triggers onUserCreated in Firebase Auth                                         |
| - Pauses 1.5s then reads name from Firestore DB 'default' users/{uid}            |
| - Calls POST /wp-json/pyq/v1/server-create-user with secret X-PYQ-Secret         |
+-----------------------------------------------------------------------------------+
```

---

## 2. Firebase Cloud Function Specification

- **Location**: [`functions/index.js`](file:///d:/webprojects/exam-app-in-united/functions/index.js)
- **Region**: `asia-south1` (Mumbai)
- **Trigger**: `onUserCreated` (v2 `firebase-functions/v2/identity`)
- **Node Runtime**: Node.js 22 LTS

### Execution Flow:
1. Listens for new Firebase Auth registrations.
2. Pauses **1.5 seconds** to allow front-end `setDoc(doc(db, "users", user.uid), { name })` to write the user profile.
3. Attempts to read user profile `name` from named Firestore database `"default"` (`getFirestore("default").doc('users/' + uid)`).
4. Falls back to standard default database `(default)` or `admin.auth().getUser(uid)` if empty.
5. Sends HTTP POST request to `https://dnbpedia.in/wp-json/pyq/v1/server-create-user` with header `X-PYQ-Secret: ihQt_9taH_L9B4_gTys_kfT2_gAxn` and browser `User-Agent`.

### GCP IAM Service Account Requirement:
If `admin.auth()` or Firestore reads return `insufficient permission`:
1. Open [GCP Console IAM](https://console.cloud.google.com/iam-admin/iam?project=dnbpediain).
2. Edit default Compute Service Account: `960945553986-compute@developer.gserviceaccount.com`.
3. Add role: **Firebase Admin** (`roles/firebase.admin`).

### Temporary Pause Flag (Maintenance):
To temporarily pause the Cloud Function before production updates, add `return;` at the start of `exports.createWordPressUserOnRegister`:
```javascript
exports.createWordPressUserOnRegister = onUserCreated(async (event) => {
  // PAUSED TEMPORARILY
  return;
  ...
});
```

---

## 3. Client-Side Implementation (React & Android)

### A. App Link Interceptor ([`src/App.jsx`](file:///d:/webprojects/exam-app-in-united/src/App.jsx))
- Captures clicks on links to `dnbpedia.in`.
- Bypasses static media files (`.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`, `.pdf`, `.zip`, `.rar`).
- Allows external medical sites (PubMed, WHO, CDC, Wikipedia) to open normally.

### B. Single Sign-On Helper ([`src/app/utils/wpSync.js`](file:///d:/webprojects/exam-app-in-united/src/app/utils/wpSync.js))
- `openWordPressWithAutoLogin(targetPath)`:
  - Checks concurrency lock `isSSOInProgress` to prevent duplicate clicks.
  - Emits `setSSOLoadingState(true)` to trigger visual loading feedback.
  - Obtains Firebase ID Token using `currentUser.getIdToken(false)`.
  - Sends request to `/wp-json/pyq/v1/get-login-url` with `redirect_path` and `displayName`.
  - Opens browser with single-use magic login link (`pyq_sso_token`).

### C. Visual Loading Toast ([`src/app/components/GlobalAlerts.jsx`](file:///d:/webprojects/exam-app-in-united/src/app/components/GlobalAlerts.jsx))
- Displays top floating notification when SSO link generation is in progress:
  - Title: `Opening DNBPedia... ↗`
  - Subtitle: *Authenticating single sign-on session* (with animated loading spinner).

### D. Backup Client-Side REST Sync (`ENABLE_WP_REST_SYNC`)
- Controlled by feature flag in [`src/app/config.js`](file:///d:/webprojects/exam-app-in-united/src/app/config.js).
- Default: `ENABLE_WP_REST_SYNC = false` (inactive).

---

## 4. WordPress Custom Plugin Code (`dnbpedia-pyq-sync.php` v1.4)

Deploy this code to `/wp-content/plugins/dnbpedia-pyq-sync/dnbpedia-pyq-sync.php` on `https://dnbpedia.in`:

```php
<?php
/**
 * Plugin Name: DNBPedia PYQ User Sync & SSO
 * Description: Auto-provisions subscriber accounts and handles Single Sign-On (SSO) magic links from PYQ App.
 * Version: 1.4
 * Author: PYQ Team
 */

if (!defined('ABSPATH')) exit;

add_action('rest_api_init', function () {
    // Endpoint for Backup Token REST Sync
    register_rest_route('pyq/v1', '/sync-user', array(
        'methods' => 'POST',
        'callback' => 'pyq_handle_firebase_token_sync',
        'permission_callback' => '__return_true',
    ));

    // Endpoint for 1-Time SSO Auto-Login Magic Link Generation
    register_rest_route('pyq/v1', '/get-login-url', array(
        'methods' => 'POST',
        'callback' => 'pyq_generate_one_time_login_url',
        'permission_callback' => '__return_true',
    ));

    // Custom server-to-server creation endpoint (Cloud Function)
    register_rest_route('pyq/v1', '/server-create-user', array(
        'methods' => 'POST',
        'callback' => 'pyq_server_create_user_callback',
        'permission_callback' => function ($request) {
            $secret = $request->get_header('X-PYQ-Secret');
            return ($secret === 'ihQt_9taH_L9B4_gTys_kfT2_gAxn');
        },
    ));
});

/**
 * Helper function to update WP and PMPro User Name & Meta fields
 * Smartly attaches titles like "Dr." or "Dr" to the First Name.
 */
function pyq_update_user_names($user_id, $full_name) {
    if (empty($full_name)) return;

    $full_name = trim($full_name);
    $words = array_values(array_filter(explode(' ', $full_name)));

    if (count($words) === 0) return;

    $first_name = '';
    $last_name = '';

    // Check if first word is a title prefix like "dr", "dr.", "prof", "prof."
    $first_word_clean = strtolower(rtrim($words[0], '.'));
    $is_title = in_array($first_word_clean, array('dr', 'prof', 'doc'));

    if ($is_title && count($words) > 1) {
        $first_name = $words[0] . ' ' . $words[1];
        $last_name  = (count($words) > 2) ? implode(' ', array_slice($words, 2)) : '';
    } else if (count($words) > 1) {
        $first_name = $words[0];
        $last_name  = implode(' ', array_slice($words, 1));
    } else {
        $first_name = $words[0];
        $last_name  = '';
    }

    // 1. Update Core WordPress User Account (Used natively by PMPro)
    wp_update_user(array(
        'ID'           => $user_id,
        'display_name' => $full_name,
        'first_name'   => $first_name,
        'last_name'    => $last_name,
    ));

    // 2. Update Standard User Meta (PMPro reads these)
    update_user_meta($user_id, 'first_name', $first_name);
    update_user_meta($user_id, 'last_name', $last_name);

    // 3. Update PMPro Billing Meta (For PMPro Invoices & Checkout)
    update_user_meta($user_id, 'pmpro_bfirstname', $first_name);
    update_user_meta($user_id, 'pmpro_blastname', $last_name);
}

// Server-to-server user creation callback (Cloud Function)
function pyq_server_create_user_callback($request) {
    $params = $request->get_json_params();
    $email = sanitize_email($params['email'] ?? '');
    $name = sanitize_text_field($params['name'] ?? '');
    $username = sanitize_user($params['username'] ?? '');

    if (empty($email) || !is_email($email)) {
        return new WP_Error('invalid_email', 'Invalid Email', array('status' => 400));
    }

    if (email_exists($email)) {
        $existing_user = get_user_by('email', $email);
        if (!empty($name)) {
            pyq_update_user_names($existing_user->ID, $name);
        }
        return array('success' => true, 'message' => 'User already exists, updated name', 'wp_user_id' => $existing_user->ID);
    }

    $user_id = wp_create_user($username, wp_generate_password(18, true), $email);
    if (is_wp_error($user_id)) return $user_id;

    $user = new WP_User($user_id);
    $user->set_role('subscriber');

    pyq_update_user_names($user_id, $name);

    return array('success' => true, 'wp_user_id' => $user_id);
}

// Token Verification & Sync Handler
function pyq_handle_firebase_token_sync($request) {
    $auth_header = $request->get_header('Authorization');
    if (!$auth_header || !preg_match('/Bearer\s(\S+)/', $auth_header, $matches)) {
        return new WP_Error('missing_token', 'Authorization Bearer token required', array('status' => 401));
    }

    $id_token = $matches[1];
    $project_id = 'dnbpediain';

    $token_parts = explode('.', $id_token);
    if (count($token_parts) !== 3) {
        return new WP_Error('invalid_token', 'Malformed JWT token', array('status' => 400));
    }

    $payload = json_decode(base64_decode(str_replace(array('-', '_'), array('+', '/'), $token_parts[1])), true);
    $now = time();

    if (!$payload || $payload['iss'] !== "https://securetoken.google.com/" . $project_id || $payload['aud'] !== $project_id || $payload['exp'] < $now) {
        return new WP_Error('invalid_token_claims', 'Invalid Token Claims', array('status' => 403));
    }

    $email = sanitize_email($payload['email'] ?? '');
    $uid = sanitize_text_field($payload['sub'] ?? '');
    $params = $request->get_json_params();
    $passed_name = sanitize_text_field($params['displayName'] ?? '');
    $email_verified = !empty($payload['email_verified']);
    $username_base = sanitize_user(explode('@', $email)[0]);

    if (empty($email)) {
        return new WP_Error('no_email', 'Email not found in token payload', array('status' => 400));
    }

    if (email_exists($email)) {
        $existing_user = get_user_by('email', $email);
        update_user_meta($existing_user->ID, 'firebase_uid', $uid);
        update_user_meta($existing_user->ID, 'firebase_email_verified', $email_verified ? '1' : '0');

        // PROTECT EXISTING NAME: Only update name if explicitly passed from app,
        // or if existing user's display_name is empty or just the email username.
        if (!empty($passed_name)) {
            pyq_update_user_names($existing_user->ID, $passed_name);
        } else if (empty($existing_user->display_name) || $existing_user->display_name === $username_base) {
            if (!empty($payload['name'])) {
                pyq_update_user_names($existing_user->ID, $payload['name']);
            }
        }

        return array('success' => true, 'wp_user_id' => $existing_user->ID, 'role' => $existing_user->roles[0] ?? 'subscriber');
    }

    $name = !empty($passed_name) ? $passed_name : sanitize_text_field($payload['name'] ?? $username_base);

    $username = $username_base;
    $i = 1;
    while (username_exists($username)) {
        $username = $username_base . $i++;
    }

    $random_password = wp_generate_password(18, true);
    $user_id = wp_create_user($username, $random_password, $email);

    if (is_wp_error($user_id)) {
        return new WP_Error('creation_failed', $user_id->get_error_message(), array('status' => 500));
    }

    $user = new WP_User($user_id);
    $user->set_role('subscriber');

    pyq_update_user_names($user_id, $name);
    update_user_meta($user_id, 'firebase_uid', $uid);
    update_user_meta($user_id, 'firebase_email_verified', $email_verified ? '1' : '0');

    return array('success' => true, 'wp_user_id' => $user_id, 'role' => 'subscriber');
}

// Generate 1-Time SSO Auto-Login Link (Allows all synced users)
function pyq_generate_one_time_login_url($request) {
    $sync_result = pyq_handle_firebase_token_sync($request);
    if (is_wp_error($sync_result)) return $sync_result;

    $wp_user_id = $sync_result['wp_user_id'];
    $params = $request->get_json_params();
    $redirect_path = sanitize_text_field($params['redirect_path'] ?? '/');

    $token = bin2hex(random_bytes(32));
    set_transient('pyq_sso_' . $token, array('user_id' => $wp_user_id, 'redirect' => $redirect_path), 180);

    return array('success' => true, 'login_url' => add_query_arg('pyq_sso_token', $token, site_url()));
}

// Intercept SSO Token in Browser & Log In User
add_action('init', function () {
    if (isset($_GET['pyq_sso_token'])) {
        $token = sanitize_text_field($_GET['pyq_sso_token']);
        $sso_data = get_transient('pyq_sso_' . $token);

        if ($sso_data && !empty($sso_data['user_id'])) {
            delete_transient('pyq_sso_' . $token);
            $user_id = $sso_data['user_id'];
            $redirect_path = $sso_data['redirect'] ?? '/';

            wp_set_current_user($user_id);
            wp_set_auth_cookie($user_id, true);
            wp_redirect(site_url($redirect_path));
            exit;
        }
    }
});
```

---

## 5. Summary Matrix of Name Handling

| User Input | First Name | Last Name | Display Name |
| :--- | :--- | :--- | :--- |
| **`Dr. Mradul Dixit`** | **`Dr. Mradul`** | **`Dixit`** | `Dr. Mradul Dixit` |
| **`Dr Mradul Dixit`** | **`Dr Mradul`** | **`Dixit`** | `Dr Mradul Dixit` |
| **`Dr. Mradul`** | **`Dr. Mradul`** | *(empty)* | `Dr. Mradul` |
| **`dr. mradul`** | **`dr. mradul`** | *(empty)* | `dr. mradul` |
| **`Mradul Dixit`** | **`Mradul`** | **`Dixit`** | `Mradul Dixit` |
| **`Mradul`** | **`Mradul`** | *(empty)* | `Mradul` |

---

## 6. Verification Commands

- **Deploy Cloud Function**:
  ```bash
  firebase deploy --only functions
  ```
- **Check Function Execution Logs**:
  ```bash
  firebase functions:log -n 20
  ```
- **Local Dev Server**:
  ```bash
  npm run dev
  ```

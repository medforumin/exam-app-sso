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
    $uid = sanitize_text_field($params['uid'] ?? '');

    if (empty($email) || !is_email($email)) {
        return new WP_Error('invalid_email', 'Invalid Email', array('status' => 400));
    }

    if (email_exists($email)) {
        $existing_user = get_user_by('email', $email);
        if (!empty($name)) {
            pyq_update_user_names($existing_user->ID, $name);
        }
        if (!empty($uid)) {
            update_user_meta($existing_user->ID, 'firebase_uid', $uid);
        }
        return array('success' => true, 'message' => 'User already exists, updated name/uid', 'wp_user_id' => $existing_user->ID);
    }

    $user_id = wp_create_user($username, wp_generate_password(18, true), $email);
    if (is_wp_error($user_id)) return $user_id;

    $user = new WP_User($user_id);
    $user->set_role('subscriber');

    pyq_update_user_names($user_id, $name);
    if (!empty($uid)) {
        update_user_meta($user_id, 'firebase_uid', $uid);
    }

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

/**
 * PMPro Hooks: Triggers on Online Checkouts (Knit Pay / Razorpay) & Manual Admin Level Changes
 */
add_action('pmpro_after_checkout', 'pyq_sync_gold_membership_to_firestore', 10, 2);
add_action('pmpro_after_change_membership_level', 'pyq_handle_pmpro_level_change', 10, 3);

function pyq_handle_pmpro_level_change($level_id, $user_id, $cancel_level) {
    if (!empty($level_id) && !empty($user_id)) {
        pyq_sync_gold_membership_to_firestore($user_id, null);
    }
}

/**
 * Core function to sync PMPro Paid Membership (GOLD) to Firebase Firestore
 */
function pyq_sync_gold_membership_to_firestore($user_id, $order = null) {
    if (empty($user_id)) return;

    $user = get_userdata($user_id);
    if (!$user) return;

    // Configurable Free / Excluded Level IDs (e.g. Level ID 4 is Free Membership)
    $free_level_ids = array(4);

    // Get active PMPro level for user
    $membership_level = function_exists('pmpro_getMembershipLevelForUser') ? pmpro_getMembershipLevelForUser($user_id) : null;
    $level_id = $membership_level ? (int)$membership_level->id : 0;
    $level_name = $membership_level ? $membership_level->name : '';

    $is_free_id = in_array($level_id, $free_level_ids, true);
    $is_free_level = $membership_level && function_exists('pmpro_isLevelFree') ? pmpro_isLevelFree($membership_level) : false;
    $is_free_name = (strpos(strtolower($level_name), 'free') !== false);

    $is_free = (!$membership_level || $level_id === 0 || $is_free_id || $is_free_level || $is_free_name);

    $firebase_uid = get_user_meta($user_id, 'firebase_uid', true);
    $email = $user->user_email;
    $name = $user->display_name;

    $cloud_function_url = 'https://asia-south1-dnbpediain.cloudfunctions.net/syncGoldStatusFromWP';
    $secret = 'ihQt_9taH_L9B4_gTys_kfT2_gAxn';

    // DOWNGRADE FLOW: Revert React App user role to 'standard' if level is free or cancelled
    if ($is_free) {
        $payload = array(
            'uid'   => $firebase_uid,
            'email' => $email,
            'name'  => $name,
            'role'  => 'standard', // Downgrades React App role to 'standard'
        );

        wp_remote_post($cloud_function_url, array(
            'method'  => 'POST',
            'headers' => array('Content-Type' => 'application/json', 'X-PYQ-Secret' => $secret),
            'body'    => json_encode($payload),
            'timeout' => 15,
        ));
        return;
    }

    // Universal PMPro Duration Resolver (100% Future-Ready for any new PMPro membership level)
    $duration_months = 3; // Default fallback if no expiration is specified

    // 1. Read native PMPro expiration_number & expiration_period directly from PMPro level
    if (!empty($membership_level->expiration_number) && !empty($membership_level->expiration_period)) {
        $num = (int)$membership_level->expiration_number;
        $period = strtolower($membership_level->expiration_period);
        if ($period === 'month') {
            $duration_months = max(1, $num);
        } else if ($period === 'year') {
            $duration_months = max(1, $num * 12);
        } else if ($period === 'week') {
            $duration_months = max(1, (int)round($num / 4));
        } else if ($period === 'day') {
            $duration_months = max(1, (int)round($num / 30));
        }
    } 
    // 2. Or compute exact months if PMPro provides explicit enddate
    else if (!empty($membership_level->enddate)) {
        $end_timestamp = is_numeric($membership_level->enddate) ? (int)$membership_level->enddate : strtotime($membership_level->enddate);
        $diff_seconds = max(0, $end_timestamp - time());
        $calculated_months = (int)round($diff_seconds / (30 * 24 * 3600));
        if ($calculated_months > 0) {
            $duration_months = $calculated_months;
        }
    }
    // 3. Fallback: Universal Regex Number Extraction from level name (e.g. "Level 6M", "Pass 12 Months", etc.)
    else if (!empty($level_name)) {
        if (preg_match('/\b(\d+)\s*(year|yr|y)\b/i', $level_name, $m)) {
            $duration_months = (int)$m[1] * 12;
        } else if (preg_match('/\b(\d+)\s*(month|mth|mo|m)\b/i', $level_name, $m)) {
            $duration_months = (int)$m[1];
        } else if (preg_match('/\b(\d+)\b/', $level_name, $m)) {
            $val = (int)$m[1];
            if ($val >= 1 && $val <= 36) {
                $duration_months = $val;
            }
        }
    }

    $start_date = date('Y-m-d H:i:s');
    $expiry_date = !empty($membership_level->enddate) 
        ? date('Y-m-d H:i:s', is_numeric($membership_level->enddate) ? $membership_level->enddate : strtotime($membership_level->enddate))
        : date('Y-m-d H:i:s', strtotime("+$duration_months months"));

    $firebase_uid = get_user_meta($user_id, 'firebase_uid', true);
    $email = $user->user_email;
    $name = $user->display_name;

    $cloud_function_url = 'https://asia-south1-dnbpediain.cloudfunctions.net/syncGoldStatusFromWP';
    $secret = 'ihQt_9taH_L9B4_gTys_kfT2_gAxn';

    $payload = array(
        'uid'            => $firebase_uid,
        'email'          => $email,
        'name'           => $name,
        'role'           => 'gold',
        'goldStartAt'    => date('c', strtotime($start_date)),
        'goldExpiry'     => date('c', strtotime($expiry_date)),
        'durationMonths' => $duration_months,
        'planTitle'      => $level_name,
        'levelId'        => $level_id,
        'orderId'        => !empty($order) ? $order->code : '',
        'amount'         => !empty($order) ? floatval($order->total) : 0,
    );

    $response = wp_remote_post($cloud_function_url, array(
        'method'    => 'POST',
        'headers'   => array(
            'Content-Type' => 'application/json',
            'X-PYQ-Secret' => $secret,
        ),
        'body'      => json_encode($payload),
        'timeout'   => 15,
    ));

    if (is_wp_error($response)) {
        error_log('[PYQ Gold Sync Error] Network failure: ' . $response->get_error_message());
    } else {
        $body_text = wp_remote_retrieve_body($response);
        $res_data = json_decode($body_text, true);
        if ($res_data && !empty($res_data['uid'])) {
            // Save returned Firebase UID to WP user meta if it was newly auto-provisioned
            update_user_meta($user_id, 'firebase_uid', $res_data['uid']);
        }
        error_log('[PYQ Gold Sync Success] Synced user ' . $email . ' to Firestore GOLD till ' . $expiry_date);
    }
}


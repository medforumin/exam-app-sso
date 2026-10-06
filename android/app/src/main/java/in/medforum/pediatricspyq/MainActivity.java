package in.medforum.pediatricspyq;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.view.View;
import android.view.WindowManager;

import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.widget.Toast;

import androidx.appcompat.app.AlertDialog;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {

    // Constants for SharedPreferences
    private static final String PREFS_NAME = "NotificationPrefs";
    private static final String KEY_REMINDER_COUNT = "reminder_count";
    private static final String KEY_LAST_REMINDER_TIME = "last_reminder_time";
    private static final String KEY_FIRST_SESSION_COMPLETED = "first_session_completed"; // New key

    // CONFIGURATION: Set your interval here (e.g., 3 days)
    private static final long REMINDER_INTERVAL_MS = 3 * 24 * 60 * 60 * 1000L;
    // CONFIGURATION: Max times to show the reminder
    private static final int MAX_REMINDER_ATTEMPTS = 2;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 1. Existing Network Check Logic
        if (!NetworkUtils.isNetworkAvailable(this)) {
            Intent intent = new Intent(this, NoInternetActivity.class);
            startActivity(intent);
        }

        // 2. Intercept custom UPI and payment intent schemes in WebView to prevent ERR_UNKNOWN_URL_SCHEME
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().setWebViewClient(new BridgeWebViewClient(this.bridge) {
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                    if (request != null && request.getUrl() != null) {
                        String url = request.getUrl().toString();
                        if (isUpiOrCustomScheme(url)) {
                            return openCustomSchemeIntent(url);
                        }
                    }
                    return super.shouldOverrideUrlLoading(view, request);
                }

                @Override
                public boolean shouldOverrideUrlLoading(WebView view, String url) {
                    if (url != null && isUpiOrCustomScheme(url)) {
                        return openCustomSchemeIntent(url);
                    }
                    return super.shouldOverrideUrlLoading(view, url);
                }
            });
        }

        // 3. Existing Edge-to-Edge Logic
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        final View root = findViewById(android.R.id.content);
        ViewCompat.setOnApplyWindowInsetsListener(root, (v, windowInsets) -> {
            androidx.core.graphics.Insets insets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars());
            /*v.setPadding(v.getPaddingLeft(), insets.left, v.getPaddingRight(), insets.right);*/
            return windowInsets;
        });

        // Add screenshot and screen reader restrictions
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE);
        root.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);
    }

    /**
     * Helper to detect UPI and custom payment app intent schemes (including Razorpay)
     */
    private boolean isUpiOrCustomScheme(String url) {
        if (url == null) return false;
        String lower = url.toLowerCase();
        return lower.startsWith("upi://") ||
               lower.startsWith("gpay://") ||
               lower.startsWith("phonepe://") ||
               lower.startsWith("paytmmp://") ||
               lower.startsWith("paytm://") ||
               lower.startsWith("bhim://") ||
               lower.startsWith("rzp://") ||
               lower.startsWith("razorpay://") ||
               lower.startsWith("intent://") ||
               (lower.contains("api.razorpay.com") && lower.contains("upi"));
    }

    /**
     * Safe intent launcher for UPI URIs & App-specific intents with resolveActivity check
     */
    private boolean openCustomSchemeIntent(String url) {
        try {
            Intent intent;
            if (url.startsWith("intent://")) {
                intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME);
            } else {
                intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            // Check if there is an activity that can handle this intent
            if (intent.resolveActivity(getPackageManager()) != null) {
                startActivity(intent);
                return true;
            } else {
                // Fallback attempt: if specific package intent fails, try generic upi:// pay intent
                if (url.contains("scheme=upi") || url.startsWith("gpay://") || url.startsWith("phonepe://") || url.startsWith("paytmmp://") || url.startsWith("bhim://")) {
                    Uri uri = Uri.parse(url);
                    String query = uri.getQuery();
                    if (query != null) {
                        Intent fallbackIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("upi://pay?" + query));
                        fallbackIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        if (fallbackIntent.resolveActivity(getPackageManager()) != null) {
                            startActivity(fallbackIntent);
                            return true;
                        }
                    }
                }
                Toast.makeText(this, "No compatible UPI or payment app found on device.", Toast.LENGTH_SHORT).show();
                return false;
            }
        } catch (Exception e) {
            e.printStackTrace();
            try {
                // Emergency Fallback attempt
                if (!url.startsWith("upi://pay") && url.contains("pa=")) {
                    Uri uri = Uri.parse(url);
                    String query = uri.getQuery();
                    if (query != null) {
                        Intent fallbackIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("upi://pay?" + query));
                        fallbackIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        if (fallbackIntent.resolveActivity(getPackageManager()) != null) {
                            startActivity(fallbackIntent);
                            return true;
                        }
                    }
                }
            } catch (Exception ex) {
                ex.printStackTrace();
            }
            Toast.makeText(this, "Could not open payment application.", Toast.LENGTH_SHORT).show();
            return false;
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        // Check notifications every time the app resumes
        checkAndRemindNotifications();
    }

    /**
     * Checks conditions and shows the reminder dialog if necessary.
     */
    private void checkAndRemindNotifications() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        // --- NEW: First Launch Check ---
        // If this is the first-ever session, mark it as completed and do nothing.
        // The reminder logic will only start from the second session onwards.
        if (!prefs.getBoolean(KEY_FIRST_SESSION_COMPLETED, false)) {
            prefs.edit().putBoolean(KEY_FIRST_SESSION_COMPLETED, true).apply();
            return;
        }
        // --- End of New Logic ---

        // 1. If notifications are already enabled, do nothing
        if (areNotificationsEnabled()) {
            return;
        }

        int count = prefs.getInt(KEY_REMINDER_COUNT, 0);
        long lastTime = prefs.getLong(KEY_LAST_REMINDER_TIME, 0);
        long currentTime = System.currentTimeMillis();

        // 2. Stop if we have already shown it 2 times
        if (count >= MAX_REMINDER_ATTEMPTS) {
            return;
        }

        // 3. Check if the time interval has passed since the last reminder
        // (The first time this logic runs, lastTime will be 0, so the dialog will show)
        if (lastTime == 0 || (currentTime - lastTime) > REMINDER_INTERVAL_MS) {
            showNotificationReminderDialog(prefs, count);
        }
    }

    /**
     * Checks if notifications are enabled at the system level.
     */
    private boolean areNotificationsEnabled() {
        // Check standard notification switch
        if (!NotificationManagerCompat.from(this).areNotificationsEnabled()) {
            return false;
        }

        // For Android 13+ (API 33), check the runtime permission
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                return false;
            }
        }

        return true;
    }

    /**
     * Shows the dialog and updates the counter/timestamp.
     */
    private void showNotificationReminderDialog(SharedPreferences prefs, int currentCount) {
        // Update stats immediately so we don't show it again until next interval/session
        updateReminderStats(prefs, currentCount + 1);

        new AlertDialog.Builder(this)
                .setTitle("Enable Notifications")
                .setMessage("Please enable notifications to receive important exam updates and alerts.")
                .setPositiveButton("Settings", (dialog, which) -> {
                    openNotificationSettings();
                })
                .setNegativeButton("No Thanks", (dialog, which) -> {
                    // User said no, dialog dismisses, count is already incremented
                })
                .setCancelable(true) // Allow clicking outside
                .show();
    }

    private void updateReminderStats(SharedPreferences prefs, int newCount) {
        prefs.edit()
                .putInt(KEY_REMINDER_COUNT, newCount)
                .putLong(KEY_LAST_REMINDER_TIME, System.currentTimeMillis())
                .apply();
    }

    private void openNotificationSettings() {
        Intent intent = new Intent();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            intent.setAction(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
            intent.putExtra(Settings.EXTRA_APP_PACKAGE, getPackageName());
        } else {
            intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setData(Uri.fromParts("package", getPackageName(), null));
        }
        startActivity(intent);
    }
}

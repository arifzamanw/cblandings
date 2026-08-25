<?php
/**
 * CertificationsBay Landing Page Configuration
 * Hostinger Business Hosting Compatible Setup
 */

// Load local configuration file if present (excluded from public repository)
if (file_exists(__DIR__ . '/config.local.php')) {
    require_once __DIR__ . '/config.local.php';
}

// Resend API Key for sending transactional email notifications
if (!defined('RESEND_API_KEY')) {
    define('RESEND_API_KEY', getenv('RESEND_API_KEY') ?: 'YOUR_RESEND_API_KEY');
}

// Email addresses to receive lead notifications (Comma-separated)
if (!defined('ADMIN_NOTIFICATION_EMAIL')) {
    define('ADMIN_NOTIFICATION_EMAIL', getenv('ADMIN_EMAIL') ?: 'contact@certificationsbay.com, certificationsbay@gmail.com');
}

// Sender email address verified in Resend
if (!defined('SENDER_EMAIL')) {
    define('SENDER_EMAIL', getenv('SENDER_EMAIL') ?: 'leads@certificationbay.com');
}

// Resend Audience ID for automatic Resend Contacts Sync (Resend Dashboard -> Contacts)
if (!defined('RESEND_AUDIENCE_ID')) {
    define('RESEND_AUDIENCE_ID', getenv('RESEND_AUDIENCE_ID') ?: '55a0abe6-65a8-4bc5-8f88-902925c647b0');
}

// Page / Campaign Identifier for Tracking & Resend Sync
if (!defined('CAMPAIGN_NAME')) {
    define('CAMPAIGN_NAME', getenv('CAMPAIGN_NAME') ?: 'Expand to India');
}

// Google Ads Tracking Config
if (!defined('GOOGLE_ADS_ID')) {
    define('GOOGLE_ADS_ID', getenv('GOOGLE_ADS_ID') ?: 'AW-XXXXXXXXX');
}
if (!defined('GOOGLE_ADS_CONVERSION_LABEL')) {
    define('GOOGLE_ADS_CONVERSION_LABEL', getenv('GOOGLE_ADS_LABEL') ?: 'AbC-D_efGhIjKLmN');
}
?>

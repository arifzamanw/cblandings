<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config.php';

// Read JSON input body
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON payload received by server.']);
    exit();
}

$fullName = trim($data['fullName'] ?? '');
$email = trim($data['email'] ?? '');
$countryCode = trim($data['countryCode'] ?? '+91');
$rawPhone = trim($data['phone'] ?? '');

// Format full phone number with country code
$phone = (strpos($rawPhone, '+') === 0) ? $rawPhone : "{$countryCode} {$rawPhone}";

$company = trim($data['company'] ?? '');
$entityType = trim($data['entityType'] ?? $data['serviceRequired'] ?? 'Incorporation');
$role = trim($data['role'] ?? 'Not specified');
$source = trim($data['source'] ?? 'Landing Page');
$campaignName = trim($data['campaignName'] ?? $data['campaign_name'] ?? (defined('CAMPAIGN_NAME') ? CAMPAIGN_NAME : 'Expand to India'));
$message = trim($data['message'] ?? '');

if (empty($fullName) || empty($email) || empty($rawPhone)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Full Name, Email, and Phone Number are required.']);
    exit();
}

$nameParts = explode(' ', $fullName, 2);
$firstName = $nameParts[0];
$lastName = $nameParts[1] ?? '';

$resendSuccess = false;
$resendContactSuccess = false;
$errorReasons = [];

// -------------------------------------------------------------
// 1. Resend Email Notification via API (Multi-recipient)
// -------------------------------------------------------------
if (defined('RESEND_API_KEY') && strpos(RESEND_API_KEY, 'YOUR_RESEND_API_KEY') === false) {
    $emailHtml = "
    <h2>New India Entity Lead Received - CertificationsBay</h2>
    <p><strong>Campaign / Page Name:</strong> " . htmlspecialchars($campaignName) . "</p>
    <p><strong>Full Name:</strong> " . htmlspecialchars($fullName) . "</p>
    <p><strong>Email:</strong> " . htmlspecialchars($email) . "</p>
    <p><strong>Phone:</strong> " . htmlspecialchars($phone) . "</p>
    <p><strong>Company:</strong> " . htmlspecialchars($company ?: 'N/A') . "</p>
    <p><strong>Service Required:</strong> " . htmlspecialchars($entityType) . "</p>
    <p><strong>Role:</strong> " . htmlspecialchars($role) . "</p>
    <p><strong>Form Source:</strong> " . htmlspecialchars($source) . "</p>
    <p><strong>Requirement Details:</strong> " . nl2br(htmlspecialchars($message ?: 'None provided')) . "</p>
    <hr />
    <p><small>Submitted via CertificationsBay Landing Page on " . date('Y-m-d H:i:s T') . "</small></p>
    ";

    $recipientEmails = array_values(array_filter(array_map('trim', explode(',', ADMIN_NOTIFICATION_EMAIL))));

    $resendPayload = [
        'from' => SENDER_EMAIL,
        'to' => $recipientEmails,
        'subject' => "New Lead Inquiry: {$fullName} - {$entityType}",
        'html' => $emailHtml
    ];

    $chResend = curl_init('https://api.resend.com/emails');
    curl_setopt_array($chResend, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($resendPayload),
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . RESEND_API_KEY,
            'Content-Type: application/json'
        ],
        CURLOPT_TIMEOUT => 15,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false
    ]);
    $resendResponse = curl_exec($chResend);
    $resendHttpCode = curl_getinfo($chResend, CURLINFO_HTTP_CODE);
    $resendCurlErrNo = curl_errno($chResend);
    $resendCurlErrMsg = curl_error($chResend);
    curl_close($chResend);

    if ($resendHttpCode >= 200 && $resendHttpCode < 300) {
        $resendSuccess = true;
    } else {
        $resendDecoded = json_decode($resendResponse, true);
        $resendReason = $resendDecoded['message'] ?? $resendResponse;
        if ($resendCurlErrNo) {
            $errorReasons[] = "Resend Connection Error: {$resendCurlErrMsg}";
        } else {
            $errorReasons[] = "Resend Email Error (HTTP {$resendHttpCode}): " . (is_string($resendReason) ? $resendReason : json_encode($resendReason));
        }
    }
} else {
    $resendSuccess = true;
}

// -------------------------------------------------------------
// 2. Resend Automatic Contacts Sync (Resend Dashboard -> Contacts)
// -------------------------------------------------------------
if (defined('RESEND_AUDIENCE_ID') && !empty(trim(RESEND_AUDIENCE_ID))) {
    $resendAudienceUrl = 'https://api.resend.com/audiences/' . trim(RESEND_AUDIENCE_ID) . '/contacts';
    $resendContactPayload = [
        'email' => $email,
        'first_name' => $firstName,
        'last_name' => $lastName,
        'unsubscribed' => false,
        'data' => [
            'Name' => $fullName,
            'Phone_Number' => $phone,
            'service_required' => $entityType,
            'company_name' => $company ?: 'N/A',
            'role' => $role ?: 'Not specified',
            'message' => $message ?: 'None provided',
            'source_url' => $source,
            'campaign_name' => $campaignName
        ]
    ];

    $chResendContact = curl_init($resendAudienceUrl);
    curl_setopt_array($chResendContact, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($resendContactPayload),
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . RESEND_API_KEY,
            'Content-Type: application/json'
        ],
        CURLOPT_TIMEOUT => 15,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false
    ]);
    $resendContactResp = curl_exec($chResendContact);
    $resendContactCode = curl_getinfo($chResendContact, CURLINFO_HTTP_CODE);
    curl_close($chResendContact);

    if ($resendContactCode >= 200 && $resendContactCode < 300) {
        $resendContactSuccess = true;
    } else {
        $contactDecoded = json_decode($resendContactResp, true);
        $contactReason = $contactDecoded['message'] ?? $resendContactResp;
        if ($resendContactCode == 409) {
            // Contact already exists in audience
            $resendContactSuccess = true;
        } else {
            $errorReasons[] = "Resend Contacts Error (HTTP {$resendContactCode}): " . (is_string($contactReason) ? $contactReason : json_encode($contactReason));
        }
    }
}

// -------------------------------------------------------------
// 3. Local Lead Database Storage (Excel CSV Export & JSON)
// -------------------------------------------------------------
try {
    $leadRecord = [
        'timestamp' => date('Y-m-d H:i:s T'),
        'campaign_name' => $campaignName,
        'fullName' => $fullName,
        'email' => $email,
        'phone' => $phone,
        'company' => $company ?: 'N/A',
        'entityType' => $entityType,
        'role' => $role,
        'source' => $source,
        'message' => $message
    ];

    // Append to api/leads.json
    $jsonFile = __DIR__ . '/leads.json';
    $existingLeads = file_exists($jsonFile) ? json_decode(file_get_contents($jsonFile), true) : [];
    if (!is_array($existingLeads)) $existingLeads = [];
    $existingLeads[] = $leadRecord;
    @file_put_contents($jsonFile, json_encode($existingLeads, JSON_PRETTY_PRINT));

    // Append to api/leads.csv (Downloadable / Excel)
    $csvFile = __DIR__ . '/leads.csv';
    $csvExists = file_exists($csvFile);
    $fp = @fopen($csvFile, 'a');
    if ($fp) {
        if (!$csvExists) {
            fputcsv($fp, ['Date & Time', 'Campaign Name', 'Full Name', 'Email', 'Phone', 'Company', 'Service Required', 'Role', 'Source', 'Message']);
        }
        fputcsv($fp, [
            $leadRecord['timestamp'],
            $leadRecord['campaign_name'],
            $leadRecord['fullName'],
            $leadRecord['email'],
            $leadRecord['phone'],
            $leadRecord['company'],
            $leadRecord['entityType'],
            $leadRecord['role'],
            $leadRecord['source'],
            $leadRecord['message']
        ]);
        fclose($fp);
    }
} catch (Exception $e) {
    // Ignore local logging errors
}

if ($resendSuccess) {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Thank you! Your request has been received. Our team will contact you shortly.',
        'integrations' => [
            'resend_email' => $resendSuccess,
            'resend_contacts' => $resendContactSuccess
        ]
    ]);
} else {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => implode(' | ', $errorReasons) ?: 'Submission failed due to a server configuration issue.',
        'errors' => $errorReasons,
        'integrations' => [
            'resend_email' => $resendSuccess,
            'resend_contacts' => $resendContactSuccess
        ]
    ]);
}
?>

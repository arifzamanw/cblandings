const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 8080;

function getConfigVal(key, defaultValue = '') {
  if (process.env[key]) return process.env[key];
  const localCfg = path.join(__dirname, 'config.local.php');
  if (fs.existsSync(localCfg)) {
    try {
      const content = fs.readFileSync(localCfg, 'utf-8');
      const lines = content.split('\n');
      for (const line of lines) {
        if (line.includes(`define('${key}'`) || line.includes(`define("${key}"`)) {
          const parts = line.split("'");
          if (parts.length >= 4) return parts[3];
          const doubleParts = line.split('"');
          if (doubleParts.length >= 4) return doubleParts[3];
        }
      }
    } catch (e) {}
  }
  return defaultValue;
}

const RESEND_API_KEY = getConfigVal('RESEND_API_KEY', '');
const ADMIN_EMAILS = getConfigVal('ADMIN_NOTIFICATION_EMAIL', 'contact@certificationsbay.com, certificationsbay@gmail.com')
  .split(',')
  .map(e => e.trim())
  .filter(Boolean);
const SENDER_EMAIL = getConfigVal('SENDER_EMAIL', 'leads@certificationbay.com');
const RESEND_AUDIENCE_ID = getConfigVal('RESEND_AUDIENCE_ID', '55a0abe6-65a8-4bc5-8f88-902925c647b0');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

function sendResendRequest(endpoint, payload) {
  return new Promise((resolve) => {
    if (!RESEND_API_KEY) {
      return resolve({ success: false, error: 'No RESEND_API_KEY configured' });
    }
    const data = JSON.stringify(payload);
    const req = https.request(`https://api.resend.com${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'User-Agent': 'CertificationsBay-NodeServer/1.0'
      },
      timeout: 15000
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, statusCode: res.statusCode, body });
        } else {
          resolve({ success: false, statusCode: res.statusCode, body });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, error: 'Request timed out' });
    });

    req.write(data);
    req.end();
  });
}

function handleLeadSubmission(req, res) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    let data;
    try {
      data = JSON.parse(body);
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, message: `Invalid JSON payload: ${err.message}` }));
    }

    const fullName = String(data.fullName || '').trim();
    const email = String(data.email || '').trim();
    const countryCode = String(data.countryCode || '+91').trim();
    const rawPhone = String(data.phone || '').trim();
    const phone = rawPhone.startsWith('+') ? rawPhone : `${countryCode} ${rawPhone}`;
    const company = String(data.company || '').trim();
    const entityType = String(data.entityType || data.serviceRequired || 'Incorporation').trim();
    const role = String(data.role || 'Not specified').trim();
    const source = String(data.source || 'Landing Page').trim();
    const campaignName = String(data.campaignName || data.campaign_name || 'Expand to India').trim();
    const message = String(data.message || '').trim();

    if (!fullName || !email || !rawPhone) {
      res.writeHead(422, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, message: 'Full Name, Email, and Phone Number are required.' }));
    }

    const nameParts = fullName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    let resendEmailSuccess = false;
    let resendContactSuccess = false;
    const errors = [];

    // 1. Resend Email Notification
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const emailHtml = `
      <h2>New India Entity Lead Received - CertificationsBay</h2>
      <p><strong>Campaign / Page Name:</strong> ${campaignName}</p>
      <p><strong>Full Name:</strong> ${fullName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Company:</strong> ${company || 'N/A'}</p>
      <p><strong>Service Required:</strong> ${entityType}</p>
      <p><strong>Role:</strong> ${role}</p>
      <p><strong>Form Source:</strong> ${source}</p>
      <p><strong>Requirement Details:</strong> ${message || 'None provided'}</p>
      <hr />
      <p><small>Submitted via CertificationsBay Landing Page on ${nowStr}</small></p>
    `;

    const emailRes = await sendResendRequest('/emails', {
      from: SENDER_EMAIL,
      to: ADMIN_EMAILS,
      subject: `New Lead Inquiry: ${fullName} - ${entityType}`,
      html: emailHtml
    });

    if (emailRes.success) {
      resendEmailSuccess = true;
    } else if (emailRes.error) {
      errors.push(`Resend Email Error: ${emailRes.error}`);
    } else {
      errors.push(`Resend Email Error (HTTP ${emailRes.statusCode}): ${emailRes.body}`);
    }

    // 2. Resend Audience Sync
    if (RESEND_AUDIENCE_ID) {
      const contactRes = await sendResendRequest(`/audiences/${RESEND_AUDIENCE_ID}/contacts`, {
        email,
        first_name: firstName,
        last_name: lastName,
        unsubscribed: false,
        data: {
          Name: fullName,
          Phone_Number: phone,
          service_required: entityType,
          company_name: company || 'N/A',
          role: role || 'Not specified',
          message: message || 'None provided',
          source_url: source,
          campaign_name: campaignName
        }
      });

      if (contactRes.success || (contactRes.statusCode === 409)) {
        resendContactSuccess = true;
      } else if (contactRes.error) {
        errors.push(`Resend Contact Error: ${contactRes.error}`);
      } else {
        errors.push(`Resend Contact Error (HTTP ${contactRes.statusCode}): ${contactRes.body}`);
      }
    }

    // 3. Local Lead Storage (CSV)
    try {
      const apiDir = path.join(__dirname, 'api');
      if (!fs.existsSync(apiDir)) fs.mkdirSync(apiDir, { recursive: true });
      const csvPath = path.join(apiDir, 'leads.csv');
      const exists = fs.existsSync(csvPath);

      const sanitizeCsvField = (field) => `"${String(field).replace(/"/g, '""')}"`;
      const row = [
        nowStr,
        campaignName,
        fullName,
        email,
        phone,
        company || 'N/A',
        entityType,
        role,
        source,
        message
      ].map(sanitizeCsvField).join(',') + '\n';

      if (!exists) {
        const header = ['Date & Time', 'Campaign Name', 'Full Name', 'Email', 'Phone', 'Company', 'Service Required', 'Role', 'Source', 'Message'].map(sanitizeCsvField).join(',') + '\n';
        fs.writeFileSync(csvPath, header + row, 'utf-8');
      } else {
        fs.appendFileSync(csvPath, row, 'utf-8');
      }
    } catch (err) {
      console.error('[Log Error]', err);
    }

    if (resendEmailSuccess || !RESEND_API_KEY || errors.length === 0) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: 'Thank you! Your request has been received. Our team will contact you shortly.',
        integrations: {
          resend_email: resendEmailSuccess,
          resend_contacts: resendContactSuccess,
          local_csv_logging: true
        }
      }));
    } else {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        message: errors.join(' | ') || 'Failed to submit form.',
        errors
      }));
    }
  });
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  const parsedUrl = url.parse(req.url);
  const cleanPath = parsedUrl.pathname.replace(/\/$/, '');

  if (req.method === 'POST') {
    if (cleanPath.endsWith('/api/submit.php') || cleanPath.endsWith('submit.php')) {
      return handleLeadSubmission(req, res);
    }
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: `Endpoint ${req.url} not found` }));
  }

  if (req.method === 'GET') {
    let decodedPath = parsedUrl.pathname;
    try {
      decodedPath = decodeURIComponent(parsedUrl.pathname);
    } catch (e) {}

    let filePath = path.join(__dirname, decodedPath);
    
    // Check if path is directory or root
    if (decodedPath === '/' || decodedPath === '') {
      filePath = path.join(__dirname, 'index.html');
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        // Try appending .html
        const htmlPath = filePath + '.html';
        if (fs.existsSync(htmlPath)) {
          filePath = htmlPath;
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          return res.end(`404 Not Found: ${req.url}`);
        }
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      fs.readFile(filePath, (readErr, content) => {
        if (readErr) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          return res.end(`500 Internal Server Error`);
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      });
    });
  }
});

server.listen(PORT, () => {
  console.log(`🚀 CertificationsBay Local Server running at http://localhost:${PORT}`);
  console.log(`📧 Resend API active -> Delivering alerts to ${ADMIN_EMAILS.join(', ')}`);
});

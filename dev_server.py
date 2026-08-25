#!/usr/bin/env python3
"""
CertificationsBay Local Full-Stack Development Server
Serves static assets and provides live execution for /api/submit.php
dispatches Resend transactional emails, creates Resend contacts, and logs to api/leads.csv
"""

import http.server
import socketserver
import urllib.request
import json
import csv
import os
import sys
from datetime import datetime

PORT = 8080

def get_config_val(key, default=''):
    val = os.environ.get(key)
    if val:
        return val
    # Check config.local.php if available
    local_cfg = os.path.join(os.path.dirname(__file__), 'config.local.php')
    if os.path.exists(local_cfg):
        with open(local_cfg, 'r', encoding='utf-8') as f:
            for line in f:
                if f"define('{key}'" in line or f'define("{key}"' in line:
                    parts = line.split("'", 4)
                    if len(parts) >= 4:
                        return parts[3]
    return default

RESEND_API_KEY = get_config_val('RESEND_API_KEY', '')
ADMIN_EMAILS = [e.strip() for e in get_config_val('ADMIN_NOTIFICATION_EMAIL', 'contact@certificationsbay.com, certificationsbay@gmail.com').split(',')]
SENDER_EMAIL = get_config_val('SENDER_EMAIL', 'leads@certificationbay.com')
RESEND_AUDIENCE_ID = get_config_val('RESEND_AUDIENCE_ID', '55a0abe6-65a8-4bc5-8f88-902925c647b0')

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Accept')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        # Route POST /api/submit.php or /submit.php
        clean_path = self.path.split('?')[0].rstrip('/')
        if clean_path.endswith('/api/submit.php') or clean_path.endswith('submit.php'):
            self.handle_lead_submission()
        else:
            self.send_error(404, f"Endpoint {self.path} not found")

    def handle_lead_submission(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            raw_body = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(raw_body)
        except Exception as err:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'success': False, 'message': f'Invalid JSON payload: {str(err)}'}).encode('utf-8'))
            return

        full_name = str(data.get('fullName', '')).strip()
        email = str(data.get('email', '')).strip()
        country_code = str(data.get('countryCode', '+91')).strip()
        raw_phone = str(data.get('phone', '')).strip()
        phone = raw_phone if raw_phone.startswith('+') else f"{country_code} {raw_phone}"
        company = str(data.get('company', '')).strip()
        entity_type = str(data.get('entityType', data.get('serviceRequired', 'Incorporation'))).strip()
        role = str(data.get('role', 'Not specified')).strip()
        source = str(data.get('source', 'Landing Page')).strip()
        campaign_name = str(data.get('campaignName', data.get('campaign_name', 'Expand to India'))).strip()
        message = str(data.get('message', '')).strip()

        if not full_name or not email or not raw_phone:
            self.send_response(422)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'success': False, 'message': 'Full Name, Email, and Phone Number are required.'}).encode('utf-8'))
            return

        name_parts = full_name.split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''

        resend_email_success = False
        resend_contact_success = False
        errors = []

        # 1. Resend Transactional Email Notification
        try:
            email_html = f"""
            <h2>New India Entity Lead Received - CertificationsBay</h2>
            <p><strong>Campaign / Page Name:</strong> {campaign_name}</p>
            <p><strong>Full Name:</strong> {full_name}</p>
            <p><strong>Email:</strong> {email}</p>
            <p><strong>Phone:</strong> {phone}</p>
            <p><strong>Company:</strong> {company or 'N/A'}</p>
            <p><strong>Service Required:</strong> {entity_type}</p>
            <p><strong>Role:</strong> {role}</p>
            <p><strong>Form Source:</strong> {source}</p>
            <p><strong>Requirement Details:</strong> {message or 'None provided'}</p>
            <hr />
            <p><small>Submitted via CertificationsBay Landing Page on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</small></p>
            """

            email_payload = {
                'from': SENDER_EMAIL,
                'to': ADMIN_EMAILS,
                'subject': f"New Lead Inquiry: {full_name} - {entity_type}",
                'html': email_html
            }

            req = urllib.request.Request(
                'https://api.resend.com/emails',
                data=json.dumps(email_payload).encode('utf-8'),
                headers={
                    'Authorization': f'Bearer {RESEND_API_KEY}',
                    'Content-Type': 'application/json',
                    'User-Agent': 'CertificationsBay-Server/1.0'
                },
                method='POST'
            )

            with urllib.request.urlopen(req, timeout=15) as res:
                if 200 <= res.status < 300:
                    resend_email_success = True
        except Exception as e:
            errors.append(f"Resend Email Error: {str(e)}")

        # 2. Resend Audience Contact Sync
        if RESEND_AUDIENCE_ID:
            try:
                contact_payload = {
                    'email': email,
                    'first_name': first_name,
                    'last_name': last_name,
                    'unsubscribed': False,
                    'data': {
                        'Name': full_name,
                        'Phone_Number': phone,
                        'service_required': entity_type,
                        'company_name': company or 'N/A',
                        'role': role or 'Not specified',
                        'message': message or 'None provided',
                        'source_url': source,
                        'campaign_name': campaign_name
                    }
                }

                req_contact = urllib.request.Request(
                    f'https://api.resend.com/audiences/{RESEND_AUDIENCE_ID}/contacts',
                    data=json.dumps(contact_payload).encode('utf-8'),
                    headers={
                        'Authorization': f'Bearer {RESEND_API_KEY}',
                        'Content-Type': 'application/json',
                        'User-Agent': 'CertificationsBay-Server/1.0'
                    },
                    method='POST'
                )

                with urllib.request.urlopen(req_contact, timeout=15) as res_c:
                    if 200 <= res_c.status < 300:
                        resend_contact_success = True
            except urllib.error.HTTPError as he:
                if he.code == 409:  # Contact already in audience
                    resend_contact_success = True
                else:
                    errors.append(f"Resend Contact Error (HTTP {he.code}): {he.read().decode('utf-8')}")
            except Exception as e:
                errors.append(f"Resend Contact Error: {str(e)}")

        # 3. Local Lead Storage (CSV & JSON)
        try:
            lead_record = {
                'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'campaign_name': campaign_name,
                'fullName': full_name,
                'email': email,
                'phone': phone,
                'company': company or 'N/A',
                'entityType': entity_type,
                'role': role,
                'source': source,
                'message': message
            }

            os.makedirs('api', exist_ok=True)
            csv_path = os.path.join('api', 'leads.csv')
            csv_exists = os.path.exists(csv_path)

            with open(csv_path, 'a', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                if not csv_exists:
                    writer.writerow(['Date & Time', 'Campaign Name', 'Full Name', 'Email', 'Phone', 'Company', 'Service Required', 'Role', 'Source', 'Message'])
                writer.writerow([
                    lead_record['timestamp'],
                    lead_record['campaign_name'],
                    lead_record['fullName'],
                    lead_record['email'],
                    lead_record['phone'],
                    lead_record['company'],
                    lead_record['entityType'],
                    lead_record['role'],
                    lead_record['source'],
                    lead_record['message']
                ])
        except Exception as e:
            print(f"[Log Error] {e}")

        # Final Response
        if resend_email_success or not errors:
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'message': 'Thank you! Your request has been received. Our team will contact you shortly.',
                'integrations': {
                    'resend_email': resend_email_success,
                    'resend_contacts': resend_contact_success
                }
            }).encode('utf-8'))
        else:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': False,
                'message': ' | '.join(errors) or 'Failed to submit form.',
                'errors': errors
            }).encode('utf-8'))

if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
        print(f"🚀 CertificationsBay Local Server running at http://localhost:{PORT}")
        print(f"📧 Resend API active -> Delivering alerts to {', '.join(ADMIN_EMAILS)}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
            httpd.server_close()

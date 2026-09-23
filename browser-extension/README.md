# Cyber Guard Browser Privacy Scanner

This Manifest V3 extension is an optional companion for Cyber Guard Browser Privacy.

## What it shows

- Cookie metadata: name, domain, path, Secure, HttpOnly and SameSite flags.
- Cookie and domain counts.
- Potentially sensitive cookie names such as session/auth/token names.
- Installed browser extensions.
- Enabled/disabled state, IDs and versions.
- Declared permissions and host permissions.
- High-impact permission indicators.

## Backend integration

The extension now uses a short-lived pairing flow instead of asking for the user's main Cyber Guard JWT.

1. Open the Cyber Guard **Browser Privacy** page.
2. Click **Generate Pairing Code**.
3. Open the companion extension.
4. Enter the 8-character pairing code.
5. Click **Connect**.
6. Grant cookie access only when you want cookie metadata.
7. Click **Scan & Send**.

The backend exchanges the one-time pairing code for a short-lived browser scanner token. The token is kept in Chrome extension session storage and is separate from the user's normal access/refresh tokens.

Default local backend:

`http://127.0.0.1:8000/api`

If the backend is deployed elsewhere, change **Backend API** in the extension and add that backend origin to the extension's `host_permissions`.

## What is stored in Cyber Guard

Only sanitized metadata is sent:

- Cookie name, domain, path, Secure, HttpOnly, SameSite, host-only and session flags.
- Extension name, version, ID, enabled state, declared permissions and host permissions.
- A summary with counts.

Cookie values are explicitly discarded by the extension before upload, and the backend also strips any submitted cookie value field as defense in depth.

The backend stores scan metadata in encrypted database fields and associates each scan with the authenticated Cyber Guard user.

## What it does not do

- It never displays cookie values.
- It never stores cookie values.
- It never sends cookie values to Cyber Guard or any external server.
- It does not claim that a declared permission proves an extension actually used the data.
- It does not inspect extension source code or prove runtime behavior.

## Install locally in Chrome

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Select **Load unpacked**.
4. Choose this `browser-extension` directory.
5. Open Cyber Guard Browser Privacy and generate a pairing code.
6. Enter the code in the extension and connect.
7. Grant cookie access only when you want the cookie metadata scan.
8. Click **Scan & Send**.

The scanner requests all-sites cookie access only after the explicit user action.

## Security model

Authentication/session cookie values are credentials and are never surfaced by this tool. Browser scan tokens are short-lived and separate from the main Cyber Guard JWT. Server-side scan records are encrypted at rest using the project's existing AES-256-GCM encrypted JSON field.

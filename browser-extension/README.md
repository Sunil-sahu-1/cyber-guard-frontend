# Cyber Guard Browser Privacy Scanner

This Manifest V3 extension is an optional companion for Cyber Guard Self Protection.

## What it shows
- Cookie metadata: name, domain, path, Secure, HttpOnly and SameSite flags.
- Cookie and domain counts.
- Potentially sensitive cookie names such as session/auth/token names.
- Installed browser extensions.
- Enabled/disabled state, IDs and versions.
- Declared permissions and host permissions.
- High-impact permission indicators.

## What it does not do
- It never displays cookie values.
- It never stores cookie values.
- It never sends cookie values to Cyber Guard or any external server.
- It does not claim that a declared permission proves an extension actually used the data.
- It does not inspect extension source code or prove runtime behavior.

## Install locally in Chrome
1. Open chrome://extensions.
2. Enable Developer mode.
3. Select Load unpacked.
4. Choose this browser-extension directory.
5. Open Cyber Guard Browser Privacy Scanner.
6. Click Grant cookie access only if you want the cookie metadata scan.
7. Click Scan browser.

Cookie access requires the Chrome cookies API plus host permissions for the sites whose cookies are queried. The scanner requests all-sites access only after the user clicks the explicit access button.

The installed-extension view uses Chrome's management API to inspect declared permissions.

## Security model
The scanner is deliberately metadata-only for cookies. Authentication and session cookie values are credentials and are not surfaced by this tool.

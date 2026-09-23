# Cyber Guard Browser Privacy Scanner

The companion scanner is designed to make Browser Privacy automatic after a one-time extension installation.

## Automatic flow

1. Install the companion extension once.
2. Open Cyber Guard -> Browser Privacy.
3. The dashboard detects the companion automatically.
4. The extension collects cookie metadata and installed-extension permissions.
5. The dashboard uploads only sanitized metadata to the authenticated Cyber Guard backend.
6. The page refreshes the browser privacy scan automatically while it is open.

There is **no pairing code** in automatic mode.

## Browser support

The implementation uses the cross-browser WebExtensions model and includes both MV3 service-worker and background-script declarations so the same codebase can run across:

- Chrome
- Microsoft Edge
- Brave
- Opera
- Firefox

Safari uses a different signed extension distribution flow and should receive a separate Safari package before being offered as a production install.

Modern browsers intentionally control extension installation and permission approval. A normal website cannot silently install a browser extension or bypass those browser security prompts.

## What is collected

Cookie metadata only:

- cookie name
- domain
- path
- Secure
- HttpOnly
- SameSite
- host-only
- session flag

Installed extension metadata:

- name
- version
- ID
- enabled/disabled state
- declared API permissions
- declared host permissions
- high-impact permission indicators

## What is never collected or uploaded

- Cookie values
- Session tokens
- Authentication tokens
- Passwords
- Cookie contents

The extension strips cookie values before data leaves the browser. The backend also discards any submitted cookie value field as defense in depth.

## Why broad browser permission is required

The browser cookie API only exposes cookies for domains for which the extension has the required host permission. The extension therefore requests the browser permission needed for a complete privacy inventory. This permission is visible to the user in the browser's extension permissions UI.

## Runtime behavior limitation

Declared extension permissions tell Cyber Guard what another extension is allowed to access. They do not prove that the extension actually read a specific user's data. Proving runtime behavior requires controlled runtime analysis or source analysis.

## Local development

For the current Cyber Guard development setup, the bridge automatically works with:

- http://127.0.0.1:3000
- http://localhost:3000

If the Cyber Guard frontend is deployed to another domain, that domain should be added to the extension's content-script match list before publishing the extension.

## Security model

The companion extension does not need the user's Cyber Guard JWT. Browser metadata is returned to the already authenticated Cyber Guard dashboard through the extension bridge, and the dashboard sends the sanitized payload to the user's authenticated backend endpoint.

The backend stores the scan metadata in encrypted JSON database fields and associates each scan with the logged-in Cyber Guard user.

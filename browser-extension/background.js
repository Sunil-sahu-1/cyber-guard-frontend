const api = globalThis.browser ?? globalThis.chrome;

const SENSITIVE_COOKIE_NAMES =
  /(session|sess|auth|token|jwt|sid|csrf|xsrf|password|passwd|secret|access|refresh)/i;

const HIGH_IMPACT = new Set([
  "cookies",
  "tabs",
  "webRequest",
  "webRequestBlocking",
  "scripting",
  "history",
  "clipboardRead",
  "geolocation",
  "nativeMessaging",
  "debugger",
  "downloads",
]);

function cleanCookie(cookie) {
  const name = String(cookie?.name || "").slice(0, 200);

  return {
    name,
    domain: String(cookie?.domain || "").slice(0, 255),
    path: String(cookie?.path || "").slice(0, 300),
    secure: Boolean(cookie?.secure),
    httpOnly: Boolean(cookie?.httpOnly),
    sameSite: String(cookie?.sameSite || ""),
    hostOnly: Boolean(cookie?.hostOnly),
    session: Boolean(cookie?.session),
    sensitive: SENSITIVE_COOKIE_NAMES.test(name),
  };
}

function cleanExtension(extension) {
  const permissions = Array.isArray(extension?.permissions)
    ? extension.permissions.slice(0, 100).map(String)
    : [];

  const hostPermissions = Array.isArray(extension?.hostPermissions)
    ? extension.hostPermissions.slice(0, 100).map(String)
    : [];

  return {
    id: String(extension?.id || "").slice(0, 128),
    name: String(extension?.name || "").slice(0, 300),
    version: String(extension?.version || "").slice(0, 100),
    enabled: Boolean(extension?.enabled),
    type: String(extension?.type || "").slice(0, 50),
    permissions,
    host_permissions: hostPermissions,
    high_impact_permissions: permissions
      .filter((permission) => HIGH_IMPACT.has(permission))
      .slice(0, 100),
  };
}

async function collect() {
  if (!api?.cookies?.getAll) {
    throw new Error("Cookie API is unavailable. Check the extension permissions.");
  }

  if (!api?.management?.getAll) {
    throw new Error("Extension management API is unavailable. Check the extension permissions.");
  }

  const [cookies, allExtensions] = await Promise.all([
    api.cookies.getAll({}),
    api.management.getAll(),
  ]);

  const extensions = allExtensions
    .filter((item) => item?.type === "extension")
    .map(cleanExtension);

  return {
    browser:
      globalThis.navigator?.userAgentData?.brands?.[0]?.brand ||
      "WebExtension Browser",
    browser_version: globalThis.navigator?.userAgent || "Unknown",
    platform: globalThis.navigator?.platform || "Unknown",
    cookies: cookies
      .map(cleanCookie)
      .filter((cookie) => cookie.name),
    extensions,
  };
}

async function scanAndReturn() {
  try {
    const data = await collect();

    return {
      type: "CYBER_GUARD_SCAN_RESULT",
      ok: true,
      data,
    };
  } catch (error) {
    return {
      type: "CYBER_GUARD_SCAN_RESULT",
      ok: false,
      error: error instanceof Error ? error.message : "Browser scan failed.",
    };
  }
}

api.runtime.onMessage.addListener((message) => {
  if (!message || !message.type) return undefined;

  if (message.type === "CYBER_GUARD_SCAN") {
    return scanAndReturn();
  }

  if (message.type === "CYBER_GUARD_STATUS") {
    return Promise.resolve({
      type: "CYBER_GUARD_STATUS_RESULT",
      ok: true,
      browser: globalThis.navigator?.userAgent || "WebExtension Browser",
      extensionId: api.runtime.id,
    });
  }

  return undefined;
});

if (api.alarms?.onAlarm) {
  api.alarms.onAlarm.addListener((alarm) => {
    if (alarm?.name !== "cyber-guard-automatic-scan") return;
    // The dashboard owns authenticated upload.
    // This alarm only keeps the extension ready; it never uploads cookie data.
  });
}

if (api.alarms?.create) {
  api.alarms.create("cyber-guard-automatic-scan", {
    periodInMinutes: 5,
  }).catch?.(() => {});
}

api.runtime.onInstalled?.addListener(() => {
  console.log("Cyber Guard Browser Privacy Scanner installed and ready.");
});

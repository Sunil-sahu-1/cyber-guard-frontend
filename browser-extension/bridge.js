const api = globalThis.browser ?? globalThis.chrome;

function postToPage(message) {
  window.postMessage(message, window.location.origin);
}

api.runtime.onMessage.addListener((message) => {
  if (!message || !message.type) return;
  postToPage(message);
});

window.addEventListener("message", async (event) => {
  if (event.source !== window || event.origin !== window.location.origin) return;
  const message = event.data;
  if (!message || message.source !== "cyber-guard-dashboard") return;

  if (message.type === "CYBER_GUARD_SCAN_REQUEST") {
    try {
      const result = await api.runtime.sendMessage({ type: "CYBER_GUARD_SCAN" });
      postToPage(result);
    } catch (error) {
      postToPage({
        type: "CYBER_GUARD_SCAN_RESULT",
        ok: false,
        error: error instanceof Error ? error.message : "Scanner unavailable."
      });
    }
  }

  if (message.type === "CYBER_GUARD_STATUS_REQUEST") {
    try {
      const result = await api.runtime.sendMessage({ type: "CYBER_GUARD_STATUS" });
      postToPage(result);
    } catch (error) {
      postToPage({
        type: "CYBER_GUARD_STATUS_RESULT",
        ok: false,
        error: error instanceof Error ? error.message : "Scanner unavailable."
      });
    }
  }
});

postToPage({
  type: "CYBER_GUARD_EXTENSION_READY",
  ok: true,
  browser: navigator.userAgent
});

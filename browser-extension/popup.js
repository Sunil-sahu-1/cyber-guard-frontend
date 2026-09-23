const api = globalThis.browser ?? globalThis.chrome;

const $ = (id) => document.getElementById(id);

async function scan() {
  $("status").textContent = "Scanning...";
  try {
    const result = await api.runtime.sendMessage({ type: "CYBER_GUARD_SCAN" });
    if (!result?.ok) throw new Error(result?.error || "Scan failed.");
    const data = result.data;
    $("status").textContent = "Scan completed";
    $("details").textContent = "Metadata is available to the Cyber Guard dashboard.";
    $("browserInfo").innerHTML =
      "<strong>" + escapeHtml(data.browser) + "</strong>" +
      "<div class='meta'>" + escapeHtml(data.platform) +
      " · " + data.cookies.length + " cookies · " +
      data.extensions.length + " extensions</div>";
  } catch (error) {
    $("status").textContent = "Scan failed";
    $("details").textContent = error instanceof Error ? error.message : "Scanner error.";
  }
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[c]));
}

$("scan").addEventListener("click", () => void scan());
void scan();

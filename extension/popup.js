const scoreEl = document.getElementById("score");
const recommendationEl = document.getElementById("recommendation");
const missingEl = document.getElementById("missing");
const apiInput = document.getElementById("apiUrl");

chrome.storage.local.get(["apiUrl"], (result) => {
  apiInput.value = result.apiUrl || "http://localhost:5000";
});

document.getElementById("saveApi").addEventListener("click", () => {
  chrome.storage.local.set({ apiUrl: apiInput.value.trim() || "http://localhost:5000" });
});

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

document.getElementById("analyze").addEventListener("click", async () => {
  const tab = await getActiveTab();
  if (!tab?.id) return;

  chrome.tabs.sendMessage(tab.id, { type: "GET_JOB_DESCRIPTION" }, async (response) => {
    if (!response?.description) {
      recommendationEl.textContent = "Could not extract job description from this page.";
      return;
    }

    const store = await chrome.storage.local.get(["apiUrl"]);
    const base = store.apiUrl || "http://localhost:5000";

    try {
      const result = await fetch(`${base}/extension/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: response.description, url: response.url }),
      });
      const data = await result.json();
      scoreEl.textContent = `${data.fitScore}%`;
      recommendationEl.textContent = data.recommendation;
      missingEl.textContent = `Missing skills: ${(data.missingSkills || []).join(", ")}`;
    } catch (error) {
      recommendationEl.textContent = "Backend unreachable. Start server and try again.";
    }
  });
});

document.getElementById("autofill").addEventListener("click", async () => {
  const tab = await getActiveTab();
  if (!tab?.id) return;
  chrome.tabs.sendMessage(tab.id, { type: "SMART_AUTOFILL" }, () => {
    recommendationEl.textContent = "Fields filled. Review before final submit.";
  });
});

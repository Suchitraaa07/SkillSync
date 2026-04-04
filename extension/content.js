function getJobDescription() {
  const selectors = [
    ".show-more-less-html__markup",
    ".description__text",
    "[class*='job-description']",
    ".internship_details",
    ".text-container",
    "main"
  ];

  for (const selector of selectors) {
    const node = document.querySelector(selector);
    if (node && node.innerText && node.innerText.trim().length > 80) {
      return node.innerText.trim();
    }
  }

  return document.body?.innerText?.slice(0, 6000) || "";
}

function smartAutofill() {
  const fields = document.querySelectorAll("input[type='text'], textarea");
  fields.forEach((field) => {
    const name = (field.getAttribute("name") || field.getAttribute("placeholder") || "").toLowerCase();
    if (!field.value && (name.includes("cover") || name.includes("why") || name.includes("motivation"))) {
      field.value = "I am excited about this role because it aligns with my technical growth goals, and I can contribute through strong problem solving and project execution skills.";
      field.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === "GET_JOB_DESCRIPTION") {
    sendResponse({ description: getJobDescription(), url: window.location.href });
  }

  if (request.type === "SMART_AUTOFILL") {
    smartAutofill();
    sendResponse({ ok: true });
  }

  return true;
});

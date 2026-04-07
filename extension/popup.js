const scoreEl = document.getElementById("score");
const recommendationEl = document.getElementById("recommendation");
const missingEl = document.getElementById("missing");
const apiInput = document.getElementById("apiUrl");
const resumeTextEl = document.getElementById("resumeText");
const resumeStatusEl = document.getElementById("resumeStatus");
const resumeInsightsEl = document.getElementById("resumeInsights");
const autoSubmitEl = document.getElementById("autoSubmit");
const fullNameEl = document.getElementById("fullName");
const emailEl = document.getElementById("email");
const phoneEl = document.getElementById("phone");
const locationEl = document.getElementById("location");
const linkedinEl = document.getElementById("linkedin");
const githubEl = document.getElementById("github");
const portfolioEl = document.getElementById("portfolio");
const experienceYearsEl = document.getElementById("experienceYears");
const skillsEl = document.getElementById("skills");
const coverLetterEl = document.getElementById("coverLetter");

function parseResumeProfile(rawText) {
  const text = (rawText || "").trim();
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const firstLine = lines[0] || "";
  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = text.match(/(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3}\)?[\s-]?)?\d{3}[\s-]?\d{4}/);
  const linkedinMatch = text.match(/https?:\/\/(?:www\.)?linkedin\.com\/[\w\-./?=&%]+/i);
  const githubMatch = text.match(/https?:\/\/(?:www\.)?github\.com\/[\w\-.]+/i);
  const portfolioMatch = text.match(/https?:\/\/(?!.*(linkedin|github|leetcode))[^\s]+/i);
  const skillMatches = text
    .toLowerCase()
    .match(/javascript|typescript|react|next\.js|node\.js|express|python|java|sql|mongodb|aws|docker|git|html|css/g);

  const safeName = emailMatch ? firstLine.replace(emailMatch[0], "").trim() : firstLine;
  const fullName = safeName && safeName.length < 80 ? safeName : "";

  return {
    fullName,
    email: emailMatch ? emailMatch[0] : "",
    phone: phoneMatch ? phoneMatch[0] : "",
    linkedin: linkedinMatch ? linkedinMatch[0] : "",
    github: githubMatch ? githubMatch[0] : "",
    portfolio: portfolioMatch ? portfolioMatch[0] : "",
    location: "",
    experienceYears: "",
    skills: [...new Set(skillMatches || [])].join(", "),
    coverLetter:
      "I am excited to apply for this internship because the role aligns with my skills in software development and my goal to build impactful products.",
    resumeText: text,
    updatedAt: new Date().toISOString(),
  };
}

async function getResumeProfile() {
  const store = await chrome.storage.local.get(["resumeProfile"]);
  return store.resumeProfile || null;
}

function populateProfileForm(profile) {
  fullNameEl.value = profile.fullName || "";
  emailEl.value = profile.email || "";
  phoneEl.value = profile.phone || "";
  locationEl.value = profile.location || "";
  linkedinEl.value = profile.linkedin || "";
  githubEl.value = profile.github || "";
  portfolioEl.value = profile.portfolio || "";
  experienceYearsEl.value = profile.experienceYears || "";
  skillsEl.value = profile.skills || "";
  coverLetterEl.value = profile.coverLetter || "";
}

function buildProfileFromForm() {
  return {
    fullName: fullNameEl.value.trim(),
    email: emailEl.value.trim(),
    phone: phoneEl.value.trim(),
    location: locationEl.value.trim(),
    linkedin: linkedinEl.value.trim(),
    github: githubEl.value.trim(),
    portfolio: portfolioEl.value.trim(),
    experienceYears: experienceYearsEl.value.trim(),
    skills: skillsEl.value.trim(),
    coverLetter: coverLetterEl.value.trim(),
    resumeText: resumeTextEl.value.trim(),
    updatedAt: new Date().toISOString(),
  };
}

async function getApiBaseUrl() {
  const store = await chrome.storage.local.get(["apiUrl"]);
  return store.apiUrl || "http://localhost:5000";
}

async function extractTextFromPdf(file) {
  const base = await getApiBaseUrl();
  const formData = new FormData();
  formData.append("resume", file);

  const response = await fetch(`${base}/pdf/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = "Failed to parse PDF";
    try {
      const payload = await response.json();
      errorMessage = payload?.error || payload?.message || errorMessage;
    } catch {
      // Keep default error message.
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return (data?.text || "").trim();
}

chrome.storage.local.get(["apiUrl"], (result) => {
  apiInput.value = result.apiUrl || "http://localhost:5000";
});

chrome.storage.local.get(["resumeProfile"], (result) => {
  if (!result.resumeProfile) return;
  resumeTextEl.value = result.resumeProfile.resumeText || "";
  populateProfileForm(result.resumeProfile);
  resumeStatusEl.textContent = "Resume profile loaded.";
});

document.getElementById("saveApi").addEventListener("click", () => {
  chrome.storage.local.set({ apiUrl: apiInput.value.trim() || "http://localhost:5000" });
});

document.getElementById("resumeFile").addEventListener("change", async (event) => {
  const input = event.target;
  const file = input.files && input.files[0];
  if (!file) return;

  try {
    if (/\.pdf$/i.test(file.name)) {
      resumeStatusEl.textContent = "Parsing PDF via backend...";
      const text = await extractTextFromPdf(file);
      if (!text) {
        resumeStatusEl.textContent = "PDF parsed, but no readable text was found.";
        return;
      }
      resumeTextEl.value = text;
      resumeStatusEl.textContent = `Parsed ${file.name}. Click Save Resume Profile.`;
      return;
    }

    if (!/\.txt$|\.md$/i.test(file.name)) {
      resumeStatusEl.textContent = "Upload a .pdf, .txt, or .md resume.";
      return;
    }

    const text = await file.text();
    resumeTextEl.value = text;
    resumeStatusEl.textContent = `Loaded ${file.name}. Click Save Resume Profile.`;
  } catch (error) {
    resumeStatusEl.textContent = error?.message || "Could not parse resume file.";
  }
});

document.getElementById("saveResume").addEventListener("click", async () => {
  const text = resumeTextEl.value.trim();
  if (!text) {
    resumeStatusEl.textContent = "Paste resume text first.";
    return;
  }

  const detected = parseResumeProfile(text);
  const manual = buildProfileFromForm();
  const profile = {
    ...detected,
    ...manual,
    fullName: manual.fullName || detected.fullName,
    email: manual.email || detected.email,
    phone: manual.phone || detected.phone,
    linkedin: manual.linkedin || detected.linkedin,
    github: manual.github || detected.github,
    portfolio: manual.portfolio || detected.portfolio,
    skills: manual.skills || detected.skills,
    coverLetter: manual.coverLetter || detected.coverLetter,
    resumeText: text,
    updatedAt: new Date().toISOString(),
  };

  await chrome.storage.local.set({ resumeProfile: profile });
  populateProfileForm(profile);
  resumeStatusEl.textContent = "Resume profile saved for Smart Apply.";
});

document.getElementById("analyzeResume").addEventListener("click", async () => {
  const text = resumeTextEl.value.trim();
  if (!text) {
    resumeStatusEl.textContent = "Upload or paste resume text first.";
    return;
  }

  resumeStatusEl.textContent = "Analyzing resume...";
  resumeInsightsEl.textContent = "";

  try {
    const base = await getApiBaseUrl();
    const profile = buildProfileFromForm();
    const response = await fetch(`${base}/extension/resume-analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeText: text, profile }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || "Resume analysis failed");
    }

    const highlights = (data.highlights || []).slice(0, 4);
    const missing = (data.missing || []).slice(0, 4);
    resumeInsightsEl.textContent = `Resume score: ${data.score}%\nHighlights: ${highlights.join(", ") || "None"}\nImprove: ${missing.join(", ") || "None"}`;
    resumeStatusEl.textContent = "Resume analyzed successfully.";
  } catch (error) {
    resumeStatusEl.textContent = error?.message || "Resume analysis failed.";
  }
});

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function canRunOnTab(tab) {
  const url = tab?.url || "";
  return /^https?:\/\//i.test(url);
}

async function sendMessageToTab(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}

async function ensureContentScript(tabId) {
  try {
    await sendMessageToTab(tabId, { type: "PING" });
    return;
  } catch {
    // Inject on demand for pages not covered by static content_scripts matches.
  }

  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["content.js"],
  });

  await sendMessageToTab(tabId, { type: "PING" });
}

document.getElementById("analyze").addEventListener("click", async () => {
  const tab = await getActiveTab();
  if (!tab?.id) return;
  if (!canRunOnTab(tab)) {
    recommendationEl.textContent = "Open an internship page in a normal browser tab first.";
    return;
  }

  try {
    await ensureContentScript(tab.id);
  } catch {
    recommendationEl.textContent = "Cannot access this page. Open the job page directly and try again.";
    return;
  }

  try {
    const response = await sendMessageToTab(tab.id, { type: "GET_JOB_DESCRIPTION" });
    if (!response?.description) {
      recommendationEl.textContent = "Could not extract job description from this page.";
      return;
    }

    const store = await chrome.storage.local.get(["apiUrl"]);
    const base = store.apiUrl || "http://localhost:5000";

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
    recommendationEl.textContent = "Backend unreachable or page blocked script access.";
  }
});

document.getElementById("autofill").addEventListener("click", async () => {
  const tab = await getActiveTab();
  if (!tab?.id) return;
  if (!canRunOnTab(tab)) {
    recommendationEl.textContent = "Open an internship page in a normal browser tab first.";
    return;
  }

  try {
    await ensureContentScript(tab.id);
  } catch {
    recommendationEl.textContent = "Cannot access this page. Open the job page directly and try again.";
    return;
  }

  const resumeProfile = await getResumeProfile();
  if (!resumeProfile) {
    recommendationEl.textContent = "Save resume profile first, then run Smart Apply.";
    return;
  }

  try {
    const response = await sendMessageToTab(tab.id, {
      type: "SMART_AUTOFILL",
      payload: {
        profile: resumeProfile,
        autoSubmit: Boolean(autoSubmitEl.checked),
      },
    });

    const filledCount = response?.filledCount || 0;
    if (response?.submitted) {
      recommendationEl.textContent = `Applied with ${filledCount} fields filled.`;
    } else {
      recommendationEl.textContent =
        filledCount > 0
          ? `Filled ${filledCount} fields. Review and submit.`
          : "No matching form fields found. Open the application form first.";
    }
  } catch {
    recommendationEl.textContent = "Autofill failed. Refresh page, open form, then try again.";
  }
});

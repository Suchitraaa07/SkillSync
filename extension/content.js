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

function getFieldHint(field) {
  const attrs = [
    field.getAttribute("name"),
    field.getAttribute("id"),
    field.getAttribute("placeholder"),
    field.getAttribute("aria-label"),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (attrs) return attrs;

  const id = field.getAttribute("id");
  if (!id) return "";
  const label = document.querySelector(`label[for='${id}']`);
  return (label?.textContent || "").toLowerCase();
}

function setFieldValue(field, value) {
  if (!value || field.value) return false;
  field.focus();
  field.value = value;
  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

function setSelectValue(field, preferredValue) {
  if (!preferredValue || field.value) return false;
  const options = Array.from(field.options || []);
  const target = String(preferredValue).toLowerCase();
  const match = options.find((opt) => (opt.textContent || "").toLowerCase().includes(target));
  if (!match) return false;
  field.value = match.value;
  field.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

function findApplyButton() {
  const buttons = Array.from(document.querySelectorAll("button, a"));
  return buttons.find((node) => /quick apply|easy apply|apply now|apply/i.test(node.innerText || ""));
}

function findFinalSubmitButton() {
  const buttons = Array.from(document.querySelectorAll("button, input[type='submit']"));
  return buttons.find((node) => /submit application|review|submit|send application/i.test(node.innerText || node.value || ""));
}

function smartAutofill(profile, autoSubmit) {
  const textInputs = document.querySelectorAll("input[type='text'], input[type='email'], input[type='tel'], input[type='url'], input[type='number'], textarea");
  const selectInputs = document.querySelectorAll("select");
  let filledCount = 0;
  const topSkills = String(profile.skills || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 6)
    .join(", ");

  textInputs.forEach((field) => {
    const hint = getFieldHint(field);

    if (/full.?name|name/.test(hint)) {
      if (setFieldValue(field, profile.fullName)) filledCount += 1;
      return;
    }
    if (/email/.test(hint)) {
      if (setFieldValue(field, profile.email)) filledCount += 1;
      return;
    }
    if (/phone|mobile|contact/.test(hint)) {
      if (setFieldValue(field, profile.phone)) filledCount += 1;
      return;
    }
    if (/linkedin/.test(hint)) {
      if (setFieldValue(field, profile.linkedin)) filledCount += 1;
      return;
    }
    if (/github/.test(hint)) {
      if (setFieldValue(field, profile.github)) filledCount += 1;
      return;
    }
    if (/portfolio|website/.test(hint)) {
      if (setFieldValue(field, profile.portfolio)) filledCount += 1;
      return;
    }
    if (/location|city|country|address/.test(hint)) {
      if (setFieldValue(field, profile.location)) filledCount += 1;
      return;
    }
    if (/experience|year/.test(hint)) {
      if (setFieldValue(field, profile.experienceYears)) filledCount += 1;
      return;
    }
    if (/skill|technology|tech stack|tools/.test(hint)) {
      if (setFieldValue(field, topSkills)) filledCount += 1;
      return;
    }
    if (/cover|why|motivation|about/.test(hint)) {
      if (setFieldValue(field, profile.coverLetter)) filledCount += 1;
    }
  });

  selectInputs.forEach((field) => {
    const hint = getFieldHint(field);
    if (/experience|year/.test(hint)) {
      if (setSelectValue(field, profile.experienceYears)) filledCount += 1;
      return;
    }
    if (/country|location/.test(hint)) {
      if (setSelectValue(field, profile.location)) filledCount += 1;
    }
  });

  const applyButton = findApplyButton();
  if (applyButton) {
    applyButton.click();
  }

  let submitted = false;
  if (autoSubmit) {
    const finalSubmit = findFinalSubmitButton();
    if (finalSubmit) {
      finalSubmit.click();
      submitted = true;
    }
  }

  return { filledCount, submitted };
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === "PING") {
    sendResponse({ ok: true });
  }

  if (request.type === "GET_JOB_DESCRIPTION") {
    sendResponse({ description: getJobDescription(), url: window.location.href });
  }

  if (request.type === "SMART_AUTOFILL") {
    const profile = request.payload?.profile || {};
    const autoSubmit = Boolean(request.payload?.autoSubmit);
    const result = smartAutofill(profile, autoSubmit);
    sendResponse({ ok: true, ...result });
  }

  return true;
});

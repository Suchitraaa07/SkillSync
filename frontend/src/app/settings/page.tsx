"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { Card } from "@/components/Card";
import { api } from "@/lib/api";
import { authStore } from "@/lib/auth";

type SettingsResponse = {
  account: {
    fullName: string;
    email: string;
    college: string;
    graduationYear: number | "";
  };
  platforms: {
    github: {
      username: string;
      connected: boolean;
      lastSynced: string | null;
    };
    leetcode: {
      username: string;
      connected: boolean;
      lastSynced: string | null;
    };
  };
  preferences: {
    targetRole: "Frontend" | "Backend" | "Full Stack" | "Data Science" | "AI/ML";
    preferredLocation: "Remote" | "India" | "Abroad";
    preferredCompanyType: "Startup" | "MNC" | "FAANG" | "Service";
  };
  notifications: {
    weeklyReport: boolean;
    roadmapReminder: boolean;
    interviewReminder: boolean;
  };
};

type AccountForm = {
  fullName: string;
  email: string;
  college: string;
  graduationYear: number | "";
};

type PlatformState = {
  github: {
    username: string;
    connected: boolean;
    lastSynced: string | null;
  };
  leetcode: {
    username: string;
    connected: boolean;
    lastSynced: string | null;
  };
};

type PreferencesState = SettingsResponse["preferences"];
type NotificationsState = SettingsResponse["notifications"];

type ToastState = {
  tone: "success" | "error";
  message: string;
};

const targetRoleOptions: PreferencesState["targetRole"][] = [
  "Frontend",
  "Backend",
  "Full Stack",
  "Data Science",
  "AI/ML",
];

const locationOptions: PreferencesState["preferredLocation"][] = ["Remote", "India", "Abroad"];
const companyTypeOptions: PreferencesState["preferredCompanyType"][] = [
  "Startup",
  "MNC",
  "FAANG",
  "Service",
];

const defaultAccount: AccountForm = {
  fullName: "",
  email: "",
  college: "",
  graduationYear: "",
};

const defaultPlatforms: PlatformState = {
  github: { username: "", connected: false, lastSynced: null },
  leetcode: { username: "", connected: false, lastSynced: null },
};

const defaultPreferences: PreferencesState = {
  targetRole: "Full Stack",
  preferredLocation: "Remote",
  preferredCompanyType: "Startup",
};

const defaultNotifications: NotificationsState = {
  weeklyReport: true,
  roadmapReminder: true,
  interviewReminder: false,
};

const LOCAL_SETTINGS_KEY = "skillsync_settings_v1";
const LOCAL_PROFILES_KEY = "skillsync_profiles";

const normalizeProfileUrl = (value: string) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const formatSyncTime = (value: string | null) => {
  if (!value) return "Never synced";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Never synced";
  return parsed.toLocaleString();
};

export default function SettingsPage() {
  const router = useRouter();

  const [account, setAccount] = useState<AccountForm>(defaultAccount);
  const [platforms, setPlatforms] = useState<PlatformState>(defaultPlatforms);
  const [preferences, setPreferences] = useState<PreferencesState>(defaultPreferences);
  const [notifications, setNotifications] = useState<NotificationsState>(defaultNotifications);
  const [leetCodeInput, setLeetCodeInput] = useState("");
  const [githubInput, setGithubInput] = useState("");
  const [toast, setToast] = useState<ToastState | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [savingAction, setSavingAction] = useState("");

  const applySettings = (data: SettingsResponse) => {
    setAccount({
      fullName: data.account.fullName || "",
      email: data.account.email || "",
      college: data.account.college || "",
      graduationYear: data.account.graduationYear || "",
    });
    setPlatforms(data.platforms || defaultPlatforms);
    setPreferences(data.preferences || defaultPreferences);
    setNotifications(data.notifications || defaultNotifications);
    setLeetCodeInput(data.platforms?.leetcode?.username || "");
    setGithubInput(data.platforms?.github?.username || "");
  };

  const persistSettingsLocal = (overrides?: Partial<SettingsResponse>) => {
    if (typeof window === "undefined") return;

    const snapshot: SettingsResponse = {
      account: {
        ...account,
        ...(overrides?.account || {}),
      },
      platforms: {
        ...platforms,
        ...(overrides?.platforms || {}),
      },
      preferences: {
        ...preferences,
        ...(overrides?.preferences || {}),
      },
      notifications: {
        ...notifications,
        ...(overrides?.notifications || {}),
      },
    };

    localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(snapshot));

    const existingProfilesRaw = localStorage.getItem(LOCAL_PROFILES_KEY);
    const existingProfiles = existingProfilesRaw ? JSON.parse(existingProfilesRaw) : {};
    const nextProfiles = {
      ...existingProfiles,
      github: normalizeProfileUrl(snapshot.platforms.github.username || ""),
      leetcode: normalizeProfileUrl(snapshot.platforms.leetcode.username || ""),
    };
    localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(nextProfiles));

    localStorage.setItem(
      "skillsync_preferences",
      JSON.stringify({
        weeklyReport: snapshot.notifications.weeklyReport,
        reminderNudges: snapshot.notifications.roadmapReminder,
      })
    );
  };

  useEffect(() => {
    let mounted = true;

    const loadFromLocal = () => {
      const raw = localStorage.getItem(LOCAL_SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SettingsResponse;
        applySettings(parsed);
        return true;
      }

      const user = authStore.getUser<{ name?: string; email?: string }>() || {};
      const profilesRaw = localStorage.getItem(LOCAL_PROFILES_KEY);
      const prefsRaw = localStorage.getItem("skillsync_preferences");
      const profiles = profilesRaw ? JSON.parse(profilesRaw) : {};
      const prefs = prefsRaw ? JSON.parse(prefsRaw) : {};

      const fallback: SettingsResponse = {
        account: {
          fullName: user.name || "",
          email: user.email || "",
          college: "",
          graduationYear: "",
        },
        platforms: {
          github: {
            username: normalizeProfileUrl(profiles.github || ""),
            connected: Boolean(profiles.github),
            lastSynced: null,
          },
          leetcode: {
            username: normalizeProfileUrl(profiles.leetcode || ""),
            connected: Boolean(profiles.leetcode),
            lastSynced: null,
          },
        },
        preferences: defaultPreferences,
        notifications: {
          weeklyReport: Boolean(prefs.weeklyReport ?? true),
          roadmapReminder: Boolean(prefs.reminderNudges ?? true),
          interviewReminder: false,
        },
      };

      applySettings(fallback);
      localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(fallback));
      return true;
    };

    const loadSettings = async () => {
      try {
        const { data } = await api.get<SettingsResponse>("/api/settings");
        if (!mounted) return;
        applySettings(data);
        if (typeof window !== "undefined") {
          localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(data));
        }
      } catch {
        if (!mounted) return;
        loadFromLocal();
        showToast("success", "Using local settings mode");
      } finally {
        if (mounted) setIsBootstrapping(false);
      }
    };

    loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  const showToast = (tone: ToastState["tone"], message: string) => {
    setToast({ tone, message });
    setTimeout(() => setToast(null), 2800);
  };

  const runAction = async (key: string, action: () => Promise<void>) => {
    try {
      setSavingAction(key);
      await action();
    } catch (error: any) {
      showToast("error", error?.response?.data?.message || "Action failed");
    } finally {
      setSavingAction("");
    }
  };

  const readStoredProfiles = () => {
    if (typeof window === "undefined") {
      return { linkedin: "", github: "", leetcode: "", updatedAt: null as string | null };
    }
    const raw = localStorage.getItem(LOCAL_PROFILES_KEY);
    if (!raw) return { linkedin: "", github: "", leetcode: "", updatedAt: null as string | null };
    try {
      const parsed = JSON.parse(raw);
      return {
        linkedin: normalizeProfileUrl(parsed.linkedin || ""),
        github: normalizeProfileUrl(parsed.github || ""),
        leetcode: normalizeProfileUrl(parsed.leetcode || ""),
        updatedAt: parsed.updatedAt || null,
      };
    } catch {
      return { linkedin: "", github: "", leetcode: "", updatedAt: null as string | null };
    }
  };

  const persistAndBroadcastProfiles = (profiles: { linkedin: string; github: string; leetcode: string }) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      LOCAL_PROFILES_KEY,
      JSON.stringify({
        ...profiles,
        updatedAt: new Date().toISOString(),
      })
    );
    window.dispatchEvent(new Event("skillsync:profiles-updated"));
  };

  const syncProfileLinks = async (next: Partial<{ linkedin: string; github: string; leetcode: string }>) => {
    const current = readStoredProfiles();
    const payload = {
      linkedin: normalizeProfileUrl(next.linkedin ?? current.linkedin),
      github: normalizeProfileUrl(next.github ?? current.github),
      leetcode: normalizeProfileUrl(next.leetcode ?? current.leetcode),
    };

    try {
      await api.patch("/api/auth/profiles", payload);
    } catch {
      // Keep local fallback behavior when backend is unavailable.
    }

    persistAndBroadcastProfiles(payload);
    return payload;
  };

  const onSaveAccount = async (event: FormEvent) => {
    event.preventDefault();
    await runAction("save-account", async () => {
      let message = "Account settings saved";
      try {
        const { data } = await api.put("/api/settings/account", {
          fullName: account.fullName,
          college: account.college,
          graduationYear: account.graduationYear,
        });
        message = data?.message || message;
      } catch {
        message = "Saved locally";
      }

      const token = authStore.getToken();
      const currentUser = authStore.getUser<any>() || {};
      authStore.setSession(token, { ...currentUser, name: account.fullName });
      persistSettingsLocal({
        account: {
          ...account,
        },
      });
      showToast("success", message);
    });
  };

  const onSavePreferences = async () => {
    await runAction("save-preferences", async () => {
      let message = "Preferences saved";
      try {
        const { data } = await api.put("/api/settings/preferences", preferences);
        message = data?.message || message;
      } catch {
        message = "Preferences saved locally";
      }
      persistSettingsLocal({ preferences });
      showToast("success", message);
    });
  };

  const onSaveNotifications = async () => {
    await runAction("save-notifications", async () => {
      let message = "Notification settings saved";
      try {
        const { data } = await api.put("/api/settings/notifications", notifications);
        message = data?.message || message;
      } catch {
        message = "Notifications saved locally";
      }
      persistSettingsLocal({ notifications });
      showToast("success", message);
    });
  };

  const onSyncGithub = async () => {
    await runAction("sync-github", async () => {
      const normalizedGithub = normalizeProfileUrl(githubInput);
      const mergedProfiles = await syncProfileLinks({ github: normalizedGithub });
      let nextGithub = {
        ...platforms.github,
        username: mergedProfiles.github,
        connected: Boolean(mergedProfiles.github),
        lastSynced: new Date().toISOString(),
      };
      const message = mergedProfiles.github ? "GitHub profile link synced" : "GitHub disconnected";

      setPlatforms((prev) => ({ ...prev, github: nextGithub }));
      setGithubInput(nextGithub.username || "");
      persistSettingsLocal({
        platforms: {
          ...platforms,
          github: nextGithub,
        },
      });
      showToast("success", message);
    });
  };

  const onDisconnectGithub = async () => {
    await runAction("disconnect-github", async () => {
      await syncProfileLinks({ github: "" });
      const disconnected = {
        username: "",
        connected: false,
        lastSynced: null,
      };

      setPlatforms((prev) => ({ ...prev, github: disconnected }));
      setGithubInput("");
      persistSettingsLocal({
        platforms: {
          ...platforms,
          github: disconnected,
        },
      });
      showToast("success", "GitHub disconnected");
    });
  };

  const onVerifyLeetcode = async () => {
    await runAction("verify-leetcode", async () => {
      const normalizedLeetcode = normalizeProfileUrl(leetCodeInput);
      const mergedProfiles = await syncProfileLinks({ leetcode: normalizedLeetcode });
      let nextLeetcode = {
        ...platforms.leetcode,
        username: mergedProfiles.leetcode,
        connected: Boolean(mergedProfiles.leetcode),
        lastSynced: new Date().toISOString(),
      };
      const message = mergedProfiles.leetcode ? "LeetCode profile link synced" : "LeetCode disconnected";

      setPlatforms((prev) => ({ ...prev, leetcode: nextLeetcode }));
      setLeetCodeInput(nextLeetcode.username || "");
      persistSettingsLocal({
        platforms: {
          ...platforms,
          leetcode: nextLeetcode,
        },
      });
      showToast("success", message);
    });
  };

  const onDisconnectLeetcode = async () => {
    await runAction("disconnect-leetcode", async () => {
      await syncProfileLinks({ leetcode: "" });
      const disconnected = {
        username: "",
        connected: false,
        lastSynced: null,
      };

      setPlatforms((prev) => ({ ...prev, leetcode: disconnected }));
      setLeetCodeInput("");
      persistSettingsLocal({
        platforms: {
          ...platforms,
          leetcode: disconnected,
        },
      });
      showToast("success", "LeetCode disconnected");
    });
  };

  const onResetAnalytics = async () => {
    await runAction("reset-analytics", async () => {
      let message = "Analytics reset complete";
      try {
        const { data } = await api.post("/api/settings/reset-analytics");
        message = data?.message || message;
      } catch {
        if (typeof window !== "undefined") {
          localStorage.removeItem("skillsync_resume_text");
          localStorage.removeItem("skillsync_settings_v1_analytics");
        }
        message = "Local analytics reset complete";
      }
      showToast("success", message);
    });
  };

  const onDeleteAccount = async () => {
    await runAction("delete-account", async () => {
      try {
        await api.delete("/api/settings/account");
      } catch {
        // local-only mode, proceed with local cleanup
      }
      if (typeof window !== "undefined") {
        localStorage.removeItem(LOCAL_SETTINGS_KEY);
        localStorage.removeItem(LOCAL_PROFILES_KEY);
        localStorage.removeItem("skillsync_preferences");
      }
      authStore.logout();
      showToast("success", "Account deleted");
      router.push("/login");
    });
  };

  const isBusy = useMemo(() => Boolean(savingAction), [savingAction]);

  return (
    <AuthGuard>
      <AppShell>
        {toast ? (
          <div
            className={`fixed right-6 top-6 z-50 rounded-xl border px-4 py-3 text-sm shadow-lg ${
              toast.tone === "success"
                ? "border-emerald-300/35 bg-emerald-500/12 text-emerald-100"
                : "border-rose-300/35 bg-rose-500/12 text-rose-100"
            }`}
          >
            {toast.message}
          </div>
        ) : null}

        <section className="space-y-2 pb-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Account Controls</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Settings</h1>
          <p className="text-sm text-slate-400">
            Manage account details, connected coding platforms, career preferences and reminders.
          </p>
        </section>

        {isBootstrapping ? (
          <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
            <Spinner />
            Loading settings...
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-2">
          <Card title="Account Information">
            <form onSubmit={onSaveAccount} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Full Name</label>
                <input
                  value={account.fullName}
                  onChange={(e) => setAccount((prev) => ({ ...prev, fullName: e.target.value }))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Email</label>
                <input
                  value={account.email}
                  readOnly
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/55 px-3 py-2 text-sm text-slate-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">College</label>
                <input
                  value={account.college}
                  onChange={(e) => setAccount((prev) => ({ ...prev, college: e.target.value }))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Graduation Year</label>
                <input
                  type="number"
                  min={2000}
                  max={2100}
                  value={account.graduationYear}
                  onChange={(e) =>
                    setAccount((prev) => ({
                      ...prev,
                      graduationYear: e.target.value ? Number(e.target.value) : "",
                    }))
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100"
                />
              </div>

              <button
                type="submit"
                disabled={isBusy}
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-300/35 bg-indigo-500/20 px-4 py-2 text-sm font-medium text-indigo-100 transition hover:bg-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingAction === "save-account" ? <Spinner /> : null}
                Save Changes
              </button>
            </form>
          </Card>

          <Card title="Connected Platforms">
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-100">GitHub</p>
                  <span className={`text-xs ${platforms.github.connected ? "text-emerald-200" : "text-slate-400"}`}>
                    {platforms.github.connected ? "Connected" : "Not Connected"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Profile URL: {platforms.github.username || "Not connected"}
                </p>
                <p className="text-xs text-slate-500">Last synced: {formatSyncTime(platforms.github.lastSynced)}</p>
                <input
                  value={githubInput}
                  onChange={(e) => setGithubInput(e.target.value)}
                  placeholder="GitHub profile URL"
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={onSyncGithub}
                    disabled={isBusy}
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/35 bg-emerald-500/15 px-3 py-1.5 text-sm font-medium text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingAction === "sync-github" ? <Spinner /> : null}
                    Sync Now
                  </button>
                  <button
                    type="button"
                    onClick={onDisconnectGithub}
                    disabled={isBusy}
                    className="rounded-xl border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Disconnect
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-100">LeetCode</p>
                  <span className={`text-xs ${platforms.leetcode.connected ? "text-emerald-200" : "text-slate-400"}`}>
                    {platforms.leetcode.connected ? "Connected" : "Not Connected"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Profile URL: {platforms.leetcode.username || "Not connected"}
                </p>
                <p className="text-xs text-slate-500">Last synced: {formatSyncTime(platforms.leetcode.lastSynced)}</p>
                <input
                  value={leetCodeInput}
                  onChange={(e) => setLeetCodeInput(e.target.value)}
                  placeholder="LeetCode profile URL"
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={onVerifyLeetcode}
                    disabled={isBusy}
                    className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/35 bg-cyan-500/15 px-3 py-1.5 text-sm font-medium text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingAction === "verify-leetcode" ? <Spinner /> : null}
                    Verify
                  </button>
                  <button
                    type="button"
                    onClick={onDisconnectLeetcode}
                    disabled={isBusy}
                    className="rounded-xl border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Career Preferences">
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Target Role</label>
                <select
                  value={preferences.targetRole}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      targetRole: e.target.value as PreferencesState["targetRole"],
                    }))
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100"
                >
                  {targetRoleOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Preferred Location</label>
                <select
                  value={preferences.preferredLocation}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      preferredLocation: e.target.value as PreferencesState["preferredLocation"],
                    }))
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100"
                >
                  {locationOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Preferred Company Type</label>
                <select
                  value={preferences.preferredCompanyType}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      preferredCompanyType: e.target.value as PreferencesState["preferredCompanyType"],
                    }))
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100"
                >
                  {companyTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={onSavePreferences}
                disabled={isBusy}
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-300/35 bg-indigo-500/20 px-4 py-2 text-sm font-medium text-indigo-100 transition hover:bg-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingAction === "save-preferences" ? <Spinner /> : null}
                Save Preferences
              </button>
            </div>
          </Card>

          <Card title="Notification Settings">
            <div className="space-y-3">
              <ToggleRow
                label="Weekly report"
                value={notifications.weeklyReport}
                onChange={(next) => setNotifications((prev) => ({ ...prev, weeklyReport: next }))}
              />
              <ToggleRow
                label="Roadmap reminder"
                value={notifications.roadmapReminder}
                onChange={(next) => setNotifications((prev) => ({ ...prev, roadmapReminder: next }))}
              />
              <ToggleRow
                label="Interview practice reminder"
                value={notifications.interviewReminder}
                onChange={(next) => setNotifications((prev) => ({ ...prev, interviewReminder: next }))}
              />

              <button
                type="button"
                onClick={onSaveNotifications}
                disabled={isBusy}
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-300/35 bg-indigo-500/20 px-4 py-2 text-sm font-medium text-indigo-100 transition hover:bg-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingAction === "save-notifications" ? <Spinner /> : null}
                Save Notifications
              </button>
            </div>
          </Card>

          <Card title="Danger Zone">
            <div className="space-y-3">
              <p className="text-sm text-slate-400">These actions are irreversible. Proceed with caution.</p>

              <button
                type="button"
                onClick={onResetAnalytics}
                disabled={isBusy}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-300/35 bg-amber-500/15 px-4 py-2 text-sm font-medium text-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingAction === "reset-analytics" ? <Spinner /> : null}
                Reset Analytics
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                disabled={isBusy}
                className="inline-flex items-center rounded-xl border border-rose-300/35 bg-rose-500/15 px-4 py-2 text-sm font-medium text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Delete Account
              </button>
            </div>
          </Card>
        </div>

        {showDeleteModal ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
              <h3 className="text-lg font-semibold text-white">Delete Account</h3>
              <p className="mt-2 text-sm text-slate-300">
                This will permanently delete your account, settings, tracked applications and analytics data.
              </p>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300"
                  disabled={isBusy}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onDeleteAccount}
                  disabled={isBusy}
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-300/35 bg-rose-500/15 px-4 py-2 text-sm font-medium text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingAction === "delete-account" ? <Spinner /> : null}
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </AppShell>
    </AuthGuard>
  );
}

function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />;
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2">
      <span className="text-sm text-slate-200">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 rounded-full transition ${value ? "bg-emerald-500/80" : "bg-slate-700"}`}
        aria-label={`Toggle ${label}`}
        aria-pressed={value}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
            value ? "left-5.5" : "left-0.5"
          }`}
        />
      </button>
    </label>
  );
}

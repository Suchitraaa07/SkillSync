"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  Bell,
  BriefcaseBusiness,
  ChartNoAxesColumn,
  Compass,
  FileText,
  Gauge,
  Home,
  Layers,
  LogOut,
  Map,
  Settings,
  Shield,
  Sparkles,
  Target,
  UserCircle2,
  X,
  Zap,
} from "lucide-react";
import { authStore } from "@/lib/auth";

const primaryLinks = [
  { href: "/dashboard", label: "Home", icon: Home },
];

const featureLinks = [
  { href: "/resume-optimizer", label: "Resume Analysis", icon: FileText },
  { href: "/dashboard", label: "Job Role Comparison", icon: Layers },
  { href: "/skill-gap", label: "Skill Gap Detection", icon: Gauge },
  { href: "/roadmap", label: "Learning Roadmap", icon: Map },
  { href: "/dashboard", label: "Readiness Score", icon: Shield },
];

const moreLinks = [
  { href: "/dashboard", label: "Settings", icon: Settings },
];

function SidebarLink({
  href,
  label,
  pathname,
  icon: Icon,
}: {
  href: string;
  label: string;
  pathname: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        isActive
          ? "bg-indigo-500/20 text-indigo-100 ring-1 ring-indigo-400/30"
          : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
      }`}
    >
      <Icon
        className={`h-4 w-4 transition ${
          isActive ? "text-indigo-300" : "text-slate-500 group-hover:text-slate-200"
        }`}
      />
      <span>{label}</span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useMemo(() => authStore.getUser<{ name: string }>(), []);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [profileLinks, setProfileLinks] = useState({
    linkedin: "",
    github: "",
    leetcode: "",
  });
  const [connectStatus, setConnectStatus] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("skillsync_profiles");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      setProfileLinks({
        linkedin: parsed.linkedin || "",
        github: parsed.github || "",
        leetcode: parsed.leetcode || "",
      });
    } catch {
      // Ignore malformed profile data and keep defaults.
    }
  }, []);

  const onSaveProfiles = () => {
    if (typeof window === "undefined") return;
    localStorage.setItem("skillsync_profiles", JSON.stringify(profileLinks));
    setConnectStatus("Profiles connected successfully.");
    setShowConnectModal(false);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(55,65,210,0.16),transparent_38%),radial-gradient(circle_at_80%_10%,rgba(59,130,246,0.12),transparent_34%),linear-gradient(180deg,#050816,#0a1022)] text-slate-100">
      <div className="mx-auto grid min-h-screen w-full max-w-[1400px] grid-cols-1 gap-4 p-3 md:p-4 lg:grid-cols-[265px_1fr]">
        <aside className="rounded-[24px] border border-slate-700/60 bg-slate-950/85 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-500/15 p-2.5 ring-1 ring-indigo-300/25">
              <Target className="h-5 w-5 text-indigo-300" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-white">SkillBridge AI</h1>
              <p className="text-xs text-slate-400">Your Career Co-Pilot</p>
            </div>
          </div>

          <nav className="mt-6 space-y-2">
            {primaryLinks.map((link) => (
              <SidebarLink key={link.label} {...link} pathname={pathname} />
            ))}
          </nav>

          <div className="mt-8 border-t border-slate-800 pt-5">
            <p className="mb-4 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Core Features</p>
            <div className="space-y-3">
              {featureLinks.map((link) => (
                <SidebarLink key={link.label} {...link} pathname={pathname} />
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-slate-800 pt-4">
            <div className="space-y-1.5">
              {moreLinks.map((link) => (
                <SidebarLink key={link.label} {...link} pathname={pathname} />
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/15 via-blue-500/10 to-transparent p-4">
            <p className="text-sm font-semibold text-slate-100">Track. Improve. Get Hired.</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              AI-powered insights to bridge your skill gap.
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-indigo-200">
              <Zap className="h-3.5 w-3.5" />
              <span>{user ? `Welcome ${user.name.split(" ")[0]}` : "Signed in"}</span>
            </div>
          </div>

          <button
            onClick={() => {
              authStore.logout();
              router.push("/login");
            }}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/15 px-3 py-2.5 text-sm font-medium text-rose-100 transition hover:bg-rose-500/25"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </aside>

        <main className="rounded-[24px] border border-slate-700/60 bg-slate-950/55 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.4)] backdrop-blur-xl md:p-6">
          <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-white">Welcome back, {user?.name?.split(" ")[0] || "Student"}! </h2>
              <p className="mt-1 text-sm text-slate-400">Your AI-powered career analysis at a glance.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowConnectModal(true)}
                className="rounded-xl border border-indigo-400/30 bg-indigo-500/20 px-4 py-2 text-sm font-medium text-indigo-100 hover:bg-indigo-500/30"
              >
                + Connect Profiles
              </button>
              <button className="rounded-xl border border-slate-700 bg-slate-900/90 p-2.5 text-slate-300 hover:text-white">
                <Bell className="h-4 w-4" />
              </button>
              <button className="rounded-xl border border-slate-700 bg-slate-900/90 p-2.5 text-slate-300 hover:text-white">
                <UserCircle2 className="h-4 w-4" />
              </button>
            </div>
          </header>

          {connectStatus ? (
            <p className="mb-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
              {connectStatus}
            </p>
          ) : null}

          <div className="space-y-5">{children}</div>
        </main>
      </div>

      {showConnectModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Connect Profiles</h3>
              <button
                onClick={() => setShowConnectModal(false)}
                className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                value={profileLinks.linkedin}
                onChange={(e) => setProfileLinks((prev) => ({ ...prev, linkedin: e.target.value }))}
                placeholder="LinkedIn profile URL"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
              />
              <input
                value={profileLinks.github}
                onChange={(e) => setProfileLinks((prev) => ({ ...prev, github: e.target.value }))}
                placeholder="GitHub profile URL"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
              />
              <input
                value={profileLinks.leetcode}
                onChange={(e) => setProfileLinks((prev) => ({ ...prev, leetcode: e.target.value }))}
                placeholder="LeetCode profile URL"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowConnectModal(false)}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={onSaveProfiles}
                className="rounded-xl border border-indigo-400/30 bg-indigo-500/20 px-4 py-2 text-sm font-medium text-indigo-100 hover:bg-indigo-500/30"
              >
                Save Profiles
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

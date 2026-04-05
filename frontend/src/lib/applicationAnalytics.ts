import { ApplicationItem, ApplicationStatus } from "@/components/applications/types";

type ChartDatum = {
  label: string;
  value: number;
};

type RoleChartDatum = {
  label: string;
  value: number;
  total: number;
};

type SummaryMetrics = {
  totalApplications: number;
  shortlistRate: number;
  offerRate: number;
  referralRate: number;
};

const STAGE_ORDER: Record<Exclude<ApplicationStatus, "Rejected">, number> = {
  Applied: 0,
  Shortlisted: 1,
  Interview: 2,
  Offer: 3,
};

function normalizeDate(value: string | Date | undefined) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function weekStart(dateValue: string | Date | undefined) {
  const date = normalizeDate(dateValue);
  const start = new Date(date);
  const weekday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - weekday);
  start.setHours(0, 0, 0, 0);
  return start;
}

function formatWeekLabel(date: Date) {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function stageReached(status: ApplicationStatus, stage: keyof typeof STAGE_ORDER) {
  if (status === "Rejected") return stage === "Applied";
  return STAGE_ORDER[status] >= STAGE_ORDER[stage];
}

function reachedShortlist(status: ApplicationStatus) {
  return status === "Shortlisted" || status === "Interview" || status === "Offer";
}

export function getApplicationsOverTime(applications: ApplicationItem[]): ChartDatum[] {
  const buckets = new Map<string, { label: string; value: number; sortKey: number }>();

  applications.forEach((application) => {
    const bucketDate = weekStart(application.dateApplied || application.createdAt);
    const key = bucketDate.toISOString();
    const current = buckets.get(key) || {
      label: formatWeekLabel(bucketDate),
      value: 0,
      sortKey: bucketDate.getTime(),
    };

    current.value += 1;
    buckets.set(key, current);
  });

  return Array.from(buckets.values())
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(({ label, value }) => ({ label, value }));
}

export function getConversionFunnel(applications: ApplicationItem[]): ChartDatum[] {
  return ["Applied", "Shortlisted", "Interview", "Offer"].map((stage) => ({
    label: stage,
    value: applications.filter((application) => stageReached(application.status, stage as keyof typeof STAGE_ORDER)).length,
  }));
}

export function getRoleSuccessRate(applications: ApplicationItem[]): RoleChartDatum[] {
  const grouped = new Map<string, { total: number; shortlisted: number }>();

  applications.forEach((application) => {
    const key = application.role.trim() || "Unknown";
    const current = grouped.get(key) || { total: 0, shortlisted: 0 };
    current.total += 1;
    if (reachedShortlist(application.status)) current.shortlisted += 1;
    grouped.set(key, current);
  });

  return Array.from(grouped.entries())
    .map(([label, value]) => ({
      label,
      total: value.total,
      value: value.total ? Math.round((value.shortlisted / value.total) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value || b.total - a.total)
    .slice(0, 6);
}

export function getReferralImpact(applications: ApplicationItem[]): ChartDatum[] {
  const referralGroups = [
    { label: "Referral", items: applications.filter((application) => application.referral) },
    { label: "Non-Referral", items: applications.filter((application) => !application.referral) },
  ];

  return referralGroups.map((group) => {
    const successful = group.items.filter((application) => reachedShortlist(application.status)).length;
    const value = group.items.length ? Math.round((successful / group.items.length) * 100) : 0;
    return { label: group.label, value };
  });
}

export function getSummaryMetrics(applications: ApplicationItem[]): SummaryMetrics {
  const totalApplications = applications.length;
  const shortlistedCount = applications.filter((application) => reachedShortlist(application.status)).length;
  const offersCount = applications.filter((application) => application.status === "Offer").length;
  const referralCount = applications.filter((application) => application.referral).length;

  return {
    totalApplications,
    shortlistRate: totalApplications ? Math.round((shortlistedCount / totalApplications) * 100) : 0,
    offerRate: totalApplications ? Math.round((offersCount / totalApplications) * 100) : 0,
    referralRate: totalApplications ? Math.round((referralCount / totalApplications) * 100) : 0,
  };
}

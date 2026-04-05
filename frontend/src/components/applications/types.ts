export const APPLICATION_STATUSES = [
  "Applied",
  "Shortlisted",
  "Interview",
  "Rejected",
  "Offer",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export type ApplicationItem = {
  _id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  referral: boolean;
  dateApplied: string;
  createdAt: string;
};

export type ApplicationFormValues = {
  company: string;
  role: string;
  status: ApplicationStatus;
  referral: boolean;
  dateApplied: string;
};

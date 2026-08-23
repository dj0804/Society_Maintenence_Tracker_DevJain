import { Category, ComplaintStatus, Priority } from "@prisma/client";

export const CATEGORY_LABELS: Record<Category, string> = {
  PLUMBING: "Plumbing",
  ELECTRICAL: "Electrical",
  LIFT: "Lift / Elevator",
  HOUSEKEEPING: "Housekeeping",
  SECURITY: "Security",
  PARKING: "Parking",
  WATER: "Water Supply",
  COMMON_AREA: "Common Area",
  OTHER: "Other",
};

export const STATUS_LABELS: Record<ComplaintStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];
export const STATUSES = Object.keys(STATUS_LABELS) as ComplaintStatus[];
export const PRIORITIES = Object.keys(PRIORITY_LABELS) as Priority[];

export const SETTING_OVERDUE_DAYS = "overdue_threshold_days";
export const DEFAULT_OVERDUE_DAYS = 3;

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const SESSION_COOKIE = "smt_session";

import { z } from "zod";
import { CATEGORIES, PRIORITIES, STATUSES } from "./constants";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  flatNumber: z.string().trim().min(1, "Flat number is required").max(20),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const createComplaintSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(120),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(2000),
  category: z.enum(CATEGORIES as [string, ...string[]]),
});

export const updateStatusSchema = z.object({
  status: z.enum(STATUSES as [string, ...string[]]),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

export const updatePrioritySchema = z.object({
  priority: z.enum(PRIORITIES as [string, ...string[]]),
});

export const flagOverdueSchema = z.object({
  isOverdueFlagged: z.boolean(),
});

export const createNoticeSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(120),
  body: z.string().trim().min(5, "Notice body must be at least 5 characters").max(4000),
  isImportant: z.boolean().default(false),
});

export const settingsSchema = z.object({
  overdueThresholdDays: z.coerce
    .number()
    .int("Threshold must be a whole number")
    .min(1, "Threshold must be at least 1 day")
    .max(365, "Threshold cannot exceed 365 days"),
});

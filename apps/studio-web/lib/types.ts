import type { Brief, PageBlueprint, AuditReport, AuditFinding } from "@product-studio/shared-types";

export type { Brief, PageBlueprint, AuditReport, AuditFinding };

export type ReviewStatus = "pending_review" | "approved" | "rejected";

export interface ReviewEvent {
  id: string;
  at: string;
  action: "approved" | "rejected" | "commented";
  reviewer: string;
  note: string;
}

export interface RunReview {
  status: ReviewStatus;
  events: ReviewEvent[];
}

export interface StudioRun {
  id: string;
  runNumber: number;
  createdAt: string;
  brief: Brief;
  blueprint: PageBlueprint;
  auditReport: AuditReport;
  review: RunReview;
}

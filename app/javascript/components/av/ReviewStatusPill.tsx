import React from "react";
import type { ReviewSummary } from "../../types/api";

export const REVIEW_META: Record<ReviewSummary["status"], { label: string; bg: string; fg: string }> = {
  unshared: { label: "Not shared yet", bg: "#F3F4F6", fg: "#374151" },
  pending: { label: "Awaiting review", bg: "#FEF3C7", fg: "#92400E" },
  approved: { label: "Approved", bg: "#DCFCE7", fg: "#166534" },
  changes_requested: { label: "Changes requested", bg: "#FEE2E2", fg: "#991B1B" },
};

interface ReviewStatusPillProps {
  review: ReviewSummary | undefined;
  /** Hide the pill entirely when the round was never shared (lists). */
  hideUnshared?: boolean;
  size?: "xs" | "sm";
  className?: string;
}

/** Client review state of one round: approved, changes requested, awaiting, or not shared. */
const ReviewStatusPill: React.FC<ReviewStatusPillProps> = ({ review, hideUnshared = false, size = "xs", className = "" }) => {
  if (!review) return null;
  if (hideUnshared && review.status === "unshared") return null;
  const meta = REVIEW_META[review.status];
  const extra: string[] = [];
  if (review.status !== "unshared" && review.status !== "pending" && review.pending_links > 0) extra.push(`${review.pending_links} pending`);
  if (review.open_comments > 0) extra.push(`${review.open_comments} ${review.open_comments === 1 ? "note" : "notes"}`);
  const title = [review.decided_by_name ? `${meta.label} by ${review.decided_by_name}` : meta.label, review.decision_note ? `“${review.decision_note}”` : ""].filter(Boolean).join(" · ");
  return (
    <span
      className={`inline-flex items-center gap-1 font-bold uppercase border border-black whitespace-nowrap ${size === "xs" ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2 py-1 border-2"} ${className}`}
      style={{ backgroundColor: meta.bg, color: meta.fg }}
      title={title}
      data-review-status={review.status}
    >
      {meta.label}
      {extra.length > 0 && <span className="font-normal normal-case opacity-80">· {extra.join(" · ")}</span>}
    </span>
  );
};

export default ReviewStatusPill;

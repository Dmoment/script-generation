import React, { useEffect, useMemo, useState } from "react";
import { colors } from "../../lib/theme";
import type { AvRow, ReviewComment, ReviewLink, ReviewStatus } from "../../types/api";
import {
  useCarriedNotesQuery,
  useCreateReviewLinkMutation,
  useResolveReviewCommentMutation,
  useReviewCommentsQuery,
  useReviewLinksQuery,
  useRevokeReviewLinkMutation,
} from "../../queries/av/useAvQueries";

interface ReviewPanelProps {
  versionId: number;
  roundNumber: number | undefined;
  scriptTitle: string;
  rows: AvRow[];
  focusRowId: number | null;
  onFocusHandled: () => void;
  onJumpToRow: (rowId: number) => void;
}

/** Message a writer sends with a review link; also the body of the mailto/WhatsApp share. */
export const shareMessage = (link: ReviewLink, scriptTitle: string, roundNumber: number | undefined) => {
  const who = link.client_name ? `Hi ${link.client_name.split(",")[0].trim()},` : "Hi,";
  const until = link.expires_at ? ` The link works until ${new Date(link.expires_at).toLocaleDateString()}.` : "";
  return `${who}\n\nRound ${roundNumber ?? ""} of "${scriptTitle}" is ready for your review:\n${link.url}\n\nComment on any row, then approve the round or ask for changes at the bottom. No login needed.${until}`;
};

export const STATUS_META: Record<ReviewStatus, { label: string; bg: string; fg: string }> = {
  pending: { label: "Awaiting review", bg: "#FEF3C7", fg: "#92400E" },
  approved: { label: "Approved", bg: "#DCFCE7", fg: "#166534" },
  changes_requested: { label: "Changes requested", bg: "#FEE2E2", fg: "#991B1B" },
};

const timeAgo = (iso: string) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
};

/** Summarise all links of a round into one status for the header badge. */
export const roundStatus = (links: ReviewLink[]): { status: ReviewStatus | "unshared"; by?: string | null; pending: number } => {
  const live = links.filter((l) => !l.revoked_at);
  const pending = live.filter((l) => !l.decided_at).length;
  if (live.length === 0) return { status: "unshared", pending: 0 };
  const decided = live.filter((l) => l.decided_at).sort((a, b) => (a.decided_at! < b.decided_at! ? 1 : -1));
  if (decided.length === 0) return { status: "pending", pending };
  return { status: decided[0].status, by: decided[0].decided_by_name, pending };
};

const ReviewPanel: React.FC<ReviewPanelProps> = ({ versionId, roundNumber, scriptTitle, rows, focusRowId, onFocusHandled, onJumpToRow }) => {
  const { data: carried } = useCarriedNotesQuery(versionId);
  const { data: links = [] } = useReviewLinksQuery(versionId);
  const { data: comments = [] } = useReviewCommentsQuery(versionId);
  const createLink = useCreateReviewLinkMutation(versionId);
  const revokeLink = useRevokeReviewLinkMutation(versionId);
  const resolve = useResolveReviewCommentMutation(versionId);
  const [clientName, setClientName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);

  // Suggest the client the previous round went to.
  useEffect(() => {
    const previousClient = carried?.previous_round?.review.client_name;
    if (!nameTouched && !clientName && previousClient) setClientName(previousClient);
  }, [carried, nameTouched, clientName]);

  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const nativeShare = async (link: ReviewLink) => {
    try {
      await navigator.share({ title: `${scriptTitle} · round ${roundNumber ?? ""}`, text: shareMessage(link, scriptTitle, roundNumber), url: link.url });
    } catch {
      // user dismissed the sheet
    }
  };
  const mailto = (link: ReviewLink) =>
    `mailto:?subject=${encodeURIComponent(`${scriptTitle} · round ${roundNumber ?? ""} for review`)}&body=${encodeURIComponent(shareMessage(link, scriptTitle, roundNumber))}`;
  const whatsapp = (link: ReviewLink) => `https://wa.me/?text=${encodeURIComponent(shareMessage(link, scriptTitle, roundNumber))}`;
  const [copied, setCopied] = useState<number | null>(null);
  const [showResolved, setShowResolved] = useState(false);

  const rowPosition = useMemo(() => new Map(rows.map((r) => [r.id, r.position])), [rows]);

  useEffect(() => {
    if (focusRowId === null) return;
    const el = document.getElementById(`review-row-${focusRowId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    onFocusHandled();
  }, [focusRowId, onFocusHandled]);

  const copy = async (link: ReviewLink) => {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(link.id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      window.prompt("Copy this review link", link.url);
    }
  };

  const grouped = useMemo(() => {
    const visible = comments.filter((c) => showResolved || !c.resolved_at);
    const byRow = new Map<number | "general", ReviewComment[]>();
    visible.forEach((c) => {
      const key = c.av_row_id ?? "general";
      byRow.set(key, [...(byRow.get(key) || []), c]);
    });
    const keys = [...byRow.keys()].sort((a, b) => {
      if (a === "general") return 1;
      if (b === "general") return -1;
      return (rowPosition.get(a) || 0) - (rowPosition.get(b) || 0);
    });
    return keys.map((k) => ({ key: k, items: byRow.get(k)! }));
  }, [comments, showResolved, rowPosition]);

  const resolvedCount = comments.filter((c) => c.resolved_at).length;
  const live = links.filter((l) => !l.revoked_at);
  const field = "w-full border-2 border-black bg-white px-2 py-1 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black";

  return (
    <div className="flex flex-col gap-5 text-sm">
      <section>
        <h3 className="text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-2">Share round {roundNumber ?? ""} for review</h3>
        <form
          className="flex gap-1"
          onSubmit={async (e) => {
            e.preventDefault();
            await createLink.mutateAsync({ client_name: clientName.trim() || undefined });
            setClientName("");
          }}
        >
          <input className={field} value={clientName} onChange={(e) => { setNameTouched(true); setClientName(e.target.value); }} placeholder="Client name (optional)" aria-label="Client name" maxLength={120} />
          <button type="submit" disabled={createLink.isPending} className="px-3 border-2 border-black text-white text-xs font-bold uppercase whitespace-nowrap disabled:opacity-50" style={{ backgroundColor: colors.primary.pink }}>
            {createLink.isPending ? "…" : "Create link"}
          </button>
        </form>
        <p className="text-[11px] font-mono text-gray-500 mt-1">Anyone with the link can read this round, comment, and approve it. No account needed. Links expire in 14 days.</p>
        {createLink.error && <p className="text-xs font-mono mt-1" style={{ color: colors.status.red }}>{createLink.error.message}</p>}
      </section>

      {live.length > 0 && (
        <section>
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-2">Links</h3>
          <ul className="space-y-2">
            {live.map((link) => {
              const meta = STATUS_META[link.status];
              return (
                <li key={link.id} className="border-2 border-black bg-white p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold truncate">{link.client_name || "Review link"}</span>
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 border border-black whitespace-nowrap" style={{ backgroundColor: meta.bg, color: meta.fg }}>{meta.label}</span>
                  </div>
                  {link.decided_at && (
                    <p className="text-[11px] font-mono text-gray-600 mt-1">
                      {link.status === "approved" ? "Approved" : "Changes requested"} by {link.decided_by_name} · {timeAgo(link.decided_at)}
                      {link.decision_note && <span className="block italic mt-0.5">“{link.decision_note}”</span>}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-[10px] font-mono uppercase whitespace-nowrap">
                    <button type="button" onClick={() => copy(link)} className="font-bold hover:underline">{copied === link.id ? "Copied!" : "Copy link"}</button>
                    <span className="text-gray-300">·</span>
                    <a href={mailto(link)} className="font-bold hover:underline" title="Send the link by email">Email</a>
                    <span className="text-gray-300">·</span>
                    <a href={whatsapp(link)} target="_blank" rel="noopener" className="font-bold hover:underline" title="Send the link on WhatsApp">WhatsApp</a>
                    {canNativeShare && (
                      <>
                        <span className="text-gray-300">·</span>
                        <button type="button" onClick={() => nativeShare(link)} className="font-bold hover:underline">Share…</button>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] font-mono uppercase whitespace-nowrap">
                    <a href={link.url} target="_blank" rel="noopener" className="font-bold hover:underline">Open</a>
                    <span className="text-gray-300">·</span>
                    <span className="text-gray-500">{link.comment_count} {link.comment_count === 1 ? "comment" : "comments"}</span>
                    <button type="button" onClick={() => revokeLink.mutate(link.id)} className="ml-auto hover:underline" style={{ color: colors.status.red }}>Withdraw</button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {carried?.previous_round && (carried.notes.length > 0 || carried.previous_round.review.status !== "unshared") && (
        <section>
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-2">What the client said on round {carried.previous_round.version_number}</h3>
          {carried.previous_round.review.decided_at && (
            <p className="text-xs font-mono mb-2 px-2 py-1.5 border-2 border-black" style={{ backgroundColor: STATUS_META[carried.previous_round.review.status as ReviewStatus]?.bg || "#F3F4F6" }}>
              <b>{carried.previous_round.review.decided_by_name}</b> {carried.previous_round.review.status === "approved" ? "approved" : "requested changes"}
              {carried.previous_round.review.decision_note && <span className="block italic mt-0.5">“{carried.previous_round.review.decision_note}”</span>}
            </p>
          )}
          {carried.notes.length === 0 ? (
            <p className="text-xs font-mono text-gray-500">No open notes left. Everything from round {carried.previous_round.version_number} is addressed.</p>
          ) : (
            <ul className="space-y-1.5">
              {carried.notes.map((n) => (
                <li key={n.id} className="border-2 border-black bg-white px-2 py-1.5" style={{ borderLeftWidth: 6, borderLeftColor: "#FBBF24" }}>
                  <div className="flex items-baseline gap-2 text-[11px] font-mono text-gray-500">
                    <span className="font-bold text-black">{n.author_name}</span>
                    {n.row_id ? (
                      <button type="button" onClick={() => onJumpToRow(n.row_id!)} className="underline hover:text-black" title="Go to this row">row {n.position}{n.previous_position !== n.position ? ` (was ${n.previous_position})` : ""}</button>
                    ) : n.previous_position ? (
                      <span title="That row no longer exists in this round">row {n.previous_position}, removed</span>
                    ) : (
                      <span>whole script</span>
                    )}
                    <button type="button" onClick={() => resolve.mutate({ id: n.id, resolved: true })} className="ml-auto font-bold uppercase hover:underline" style={{ color: colors.status.green }}>Done</button>
                  </div>
                  <p className="whitespace-pre-wrap">{n.body}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section>
        <h3 className="text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-2">Client comments on this round</h3>
        {comments.length === 0 && <p className="text-xs font-mono text-gray-500">Nothing yet. Comments reviewers leave on the link show up here.</p>}
        <ul className="space-y-3">
          {grouped.map(({ key, items }) => (
            <li key={String(key)} id={key === "general" ? undefined : `review-row-${key}`} className="border-2 border-black bg-white">
              <div className="px-2 py-1 border-b-2 border-black text-[10px] font-mono uppercase tracking-widest" style={{ backgroundColor: colors.background.beige }}>
                {key === "general" ? "Whole script" : `Row ${rowPosition.get(key) ?? "?"}`}
              </div>
              {items.map((c) => (
                <div key={c.id} className={`px-2 py-1.5 border-b border-gray-200 last:border-b-0 ${c.resolved_at ? "opacity-60" : ""}`}>
                  <div className="flex items-baseline gap-2 text-[11px] font-mono text-gray-500">
                    <span className="font-bold text-black">{c.author_name}</span>
                    <span>{timeAgo(c.created_at)}</span>
                    <button type="button" onClick={() => resolve.mutate({ id: c.id, resolved: !c.resolved_at })} className="ml-auto font-bold uppercase hover:underline" style={{ color: c.resolved_at ? colors.text.gray[500] : colors.status.green }}>
                      {c.resolved_at ? "Reopen" : "Resolve"}
                    </button>
                  </div>
                  <p className="whitespace-pre-wrap">{c.body}</p>
                </div>
              ))}
            </li>
          ))}
        </ul>
        {resolvedCount > 0 && (
          <label className="flex items-center gap-1 text-[11px] font-mono text-gray-600 mt-2">
            <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} /> show {resolvedCount} resolved
          </label>
        )}
      </section>
    </div>
  );
};

export default ReviewPanel;

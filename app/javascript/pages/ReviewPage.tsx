import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { colors } from "../lib/theme";
import { formatSeconds } from "../queries/av/useAvQueries";
import type { AvRow, ReviewComment, ReviewStatus, Scene } from "../types/api";
import { cueText } from "../lib/screenplay-editor";

interface ReviewPayload {
  token: string;
  client_name: string | null;
  status: ReviewStatus;
  decided_at: string | null;
  decided_by_name: string | null;
  decision_note: string | null;
  expires_at: string | null;
  script: { title: string; kind: "av" | "screenplay"; project_title: string | null; author_name: string | null };
  round: { id: number; number: number; notes: string | null; updated_at: string };
  rows: AvRow[];
  scenes: Scene[];
  total_seconds: number | null;
  comments: ReviewComment[];
}

const NAME_KEY = "review_author_name";

const readName = () => {
  try {
    return localStorage.getItem(NAME_KEY) || "";
  } catch {
    return "";
  }
};

const STATUS: Record<ReviewStatus, { label: string; bg: string; fg: string }> = {
  pending: { label: "Awaiting your review", bg: "#FEF3C7", fg: "#92400E" },
  approved: { label: "Approved", bg: "#DCFCE7", fg: "#166534" },
  changes_requested: { label: "Changes requested", bg: "#FEE2E2", fg: "#991B1B" },
};

/**
 * Public client review page. The token in the URL is the only credential:
 * read the round, comment on rows, approve or ask for changes.
 */
const ReviewPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<ReviewPayload | null>(null);
  const [error, setError] = useState<{ status: number; message: string } | null>(null);
  const [name, setName] = useState(readName);
  const [openRow, setOpenRow] = useState<number | "general" | null>(null);
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/v1/review/${token}`, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError({ status: res.status, message: body.error || `Could not load this review (${res.status})` });
      return;
    }
    setData(await res.json());
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (data) document.title = `${data.script.title} · Round ${data.round.number} · Review`;
  }, [data]);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 4000);
    return () => clearTimeout(t);
  }, [flash]);

  const rememberName = (value: string) => {
    setName(value);
    try {
      localStorage.setItem(NAME_KEY, value);
    } catch {
      // private mode; fine
    }
  };

  const post = async (path: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/v1/review/${token}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
    return json;
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !draft.trim() || openRow === null) return;
    setBusy("comment");
    try {
      await post("comments", { author_name: name.trim(), body: draft.trim(), av_row_id: openRow === "general" ? undefined : openRow });
      setDraft("");
      setOpenRow(null);
      setFlash("Comment sent to the writer.");
      await load();
    } catch (err) {
      setFlash(err instanceof Error ? err.message : "Could not send the comment");
    } finally {
      setBusy(null);
    }
  };

  const decide = async (decision: "approved" | "changes_requested") => {
    if (!name.trim()) {
      setFlash("Add your name first so the team knows who decided.");
      return;
    }
    if (decision === "changes_requested" && !note.trim()) {
      setFlash("Tell the team what to change, in a line or two.");
      return;
    }
    setBusy(decision);
    try {
      const updated = await post("decision", { decision, name: name.trim(), note: note.trim() || undefined });
      setData(updated);
      setNote("");
      setFlash(decision === "approved" ? "Approved. The team has been told." : "Sent. The team will come back with a new round.");
    } catch (err) {
      setFlash(err instanceof Error ? err.message : "Could not record your decision");
    } finally {
      setBusy(null);
    }
  };

  const commentsByRow = useMemo(() => {
    const map = new Map<number | "general", ReviewComment[]>();
    (data?.comments || []).forEach((c) => {
      const key = c.av_row_id ?? "general";
      map.set(key, [...(map.get(key) || []), c]);
    });
    return map;
  }, [data]);

  if (error) {
    const gone = error.status === 410;
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: colors.background.beigeAlt }}>
        <div className="max-w-md w-full bg-white border-2 border-black p-8 shadow-[6px_6px_0_0_rgba(0,0,0,1)] text-center">
          <h1 className="text-xl font-black uppercase mb-2">{gone ? "This link has been withdrawn" : "Review not found"}</h1>
          <p className="text-sm text-gray-700">{gone ? "The team has either sent a newer round or closed this review. Ask them for a fresh link." : "Check the link you were sent. It may be incomplete."}</p>
        </div>
      </div>
    );
  }
  if (!data) {
    return <div className="min-h-screen flex items-center justify-center font-mono text-sm text-gray-500">Loading review…</div>;
  }

  const status = STATUS[data.status];
  const field = "w-full border-2 border-black bg-white px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black";
  const CommentForm = (
    <form onSubmit={submitComment} className="mt-2 border-2 border-black bg-white p-3 flex flex-col gap-2 print:hidden">
      <input className={field} value={name} onChange={(e) => rememberName(e.target.value)} placeholder="Your name" aria-label="Your name" required maxLength={120} />
      <textarea className={`${field} min-h-[72px]`} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Your note for the writer" aria-label="Comment" required autoFocus />
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={() => setOpenRow(null)} className="px-3 py-1.5 border-2 border-black bg-white text-xs font-bold uppercase">Cancel</button>
        <button type="submit" disabled={busy === "comment"} className="px-3 py-1.5 border-2 border-black text-white text-xs font-bold uppercase disabled:opacity-50" style={{ backgroundColor: colors.primary.pink }}>Send</button>
      </div>
    </form>
  );
  const CommentList = (key: number | "general") => {
    const list = commentsByRow.get(key) || [];
    if (list.length === 0) return null;
    return (
      <ul className="mt-2 space-y-1.5">
        {list.map((c) => (
          <li key={c.id} className="text-sm border-l-4 pl-2" style={{ borderColor: c.resolved_at ? "#D1D5DB" : "#FBBF24" }}>
            <span className="font-bold">{c.author_name}</span>
            <span className="text-[11px] font-mono text-gray-500 ml-2">{new Date(c.created_at).toLocaleDateString()}{c.resolved_at ? " · addressed" : ""}</span>
            <p className="whitespace-pre-wrap text-gray-800">{c.body}</p>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background.beigeAlt }}>
      <style>{`@media print { .print\\:hidden { display: none !important; } body { background: #fff; } }`}</style>
      <header className="bg-white border-b-2 border-black">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-mono uppercase tracking-widest text-gray-500">{data.script.project_title || "Script"} · Round {data.round.number}</div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight truncate">{data.script.title}</h1>
            <div className="text-xs font-mono text-gray-600">
              {data.client_name ? `Prepared for ${data.client_name}` : "Client review"}
              {data.script.author_name ? ` · by ${data.script.author_name}` : ""}
              {data.total_seconds !== null ? ` · ${formatSeconds(data.total_seconds)} running time` : ""}
            </div>
          </div>
          <span className="text-[11px] font-bold uppercase px-2 py-1 border-2 border-black" style={{ backgroundColor: status.bg, color: status.fg }}>{status.label}</span>
          <button type="button" onClick={() => window.print()} className="px-3 py-1.5 border-2 border-black bg-white text-xs font-bold uppercase print:hidden">Print / PDF</button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {flash && <div role="status" className="mb-4 px-3 py-2 border-2 border-black bg-white font-mono text-sm shadow-[3px_3px_0_0_rgba(0,0,0,1)]">{flash}</div>}
        {data.decided_at && (
          <div className="mb-4 px-3 py-2 border-2 border-black text-sm" style={{ backgroundColor: status.bg }}>
            <b>{data.decided_by_name}</b> {data.status === "approved" ? "approved" : "requested changes to"} this round on {new Date(data.decided_at).toLocaleDateString()}.
            {data.decision_note && <span className="block italic mt-1">“{data.decision_note}”</span>}
          </div>
        )}
        <p className="text-xs font-mono text-gray-600 mb-4 print:hidden">Tap <b>Comment</b> on any row to leave a note. When you are done, approve the round or ask for changes at the bottom.</p>

        {data.script.kind === "av" ? (
          <div className="bg-white border-2 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
            <div className="hidden sm:grid grid-cols-[3rem_1fr_1fr] border-b-2 border-black bg-black text-white text-[11px] font-bold uppercase tracking-widest">
              <div className="px-2 py-2 text-center">#</div>
              <div className="px-3 py-2">Video</div>
              <div className="px-3 py-2">Audio</div>
            </div>
            {data.rows.map((row) => (
              <section key={row.id} className="border-b-2 border-black last:border-b-0 sm:grid sm:grid-cols-[3rem_1fr_1fr]">
                <div className="flex sm:flex-col items-center sm:items-center gap-2 px-2 py-2 sm:border-r-2 border-black" style={{ backgroundColor: colors.background.beigeAlt }}>
                  <span className="w-8 h-8 flex items-center justify-center font-black text-sm text-white border-2 border-black" style={{ backgroundColor: colors.primary.pink }}>{row.position}</span>
                  {row.duration_seconds !== null && <span className="text-[11px] font-mono text-gray-600">{row.duration_seconds}s</span>}
                </div>
                <div className="px-3 py-2 sm:border-r-2 border-black">
                  <div className="sm:hidden text-[10px] font-bold uppercase tracking-widest text-gray-500">Video</div>
                  {row.shot && <div className="text-[11px] font-bold uppercase font-mono text-gray-700">{row.shot}</div>}
                  <p className="text-sm whitespace-pre-wrap font-mono leading-relaxed">{row.video}</p>
                  {row.super_text && <p className="text-[11px] font-mono uppercase mt-1 text-gray-700">SUPER: {row.super_text}</p>}
                </div>
                <div className="px-3 py-2">
                  <div className="sm:hidden text-[10px] font-bold uppercase tracking-widest text-gray-500">Audio</div>
                  <p className="text-sm whitespace-pre-wrap font-mono leading-relaxed">{row.audio}</p>
                  {CommentList(row.id)}
                  {openRow === row.id ? CommentForm : (
                    <button type="button" onClick={() => { setOpenRow(row.id); setDraft(""); }} className="mt-2 text-[11px] font-mono font-bold uppercase underline print:hidden">Comment</button>
                  )}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="bg-white border-2 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] p-6 font-mono text-sm">
            {data.scenes.map((scene) => (
              <section key={scene.id} className="mb-6">
                {(scene.elements || []).map((el, i) => (
                  <p key={i} className={`whitespace-pre-wrap ${el.type === "slugline" ? "font-bold uppercase mt-4" : el.type === "character" ? "uppercase ml-[22ch]" : el.type === "dialogue" ? "ml-[10ch] mr-[15ch]" : el.type === "parenthetical" ? "ml-[16ch]" : el.type === "transition" ? "text-right uppercase" : ""}`}>
                    {el.type === "character" ? cueText(el) : el.text}
                  </p>
                ))}
              </section>
            ))}
          </div>
        )}

        <section className="mt-8 bg-white border-2 border-black p-4 print:hidden">
          <h2 className="text-sm font-black uppercase mb-1">General notes</h2>
          {CommentList("general")}
          {openRow === "general" ? CommentForm : (
            <button type="button" onClick={() => { setOpenRow("general"); setDraft(""); }} className="mt-2 text-[11px] font-mono font-bold uppercase underline">Add a note about the whole script</button>
          )}
        </section>

        <section className="mt-6 bg-white border-2 border-black p-4 shadow-[6px_6px_0_0_rgba(0,0,0,1)] print:hidden">
          <h2 className="text-sm font-black uppercase mb-2">Your decision on round {data.round.number}</h2>
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr]">
            <input className={field} value={name} onChange={(e) => rememberName(e.target.value)} placeholder="Your name" aria-label="Your name" maxLength={120} />
            <input className={field} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (required when asking for changes)" aria-label="Decision note" maxLength={2000} />
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <button type="button" disabled={!!busy} onClick={() => decide("approved")} className="px-4 py-2 border-2 border-black text-white text-sm font-bold uppercase disabled:opacity-50" style={{ backgroundColor: colors.status.green }}>
              Approve this round
            </button>
            <button type="button" disabled={!!busy} onClick={() => decide("changes_requested")} className="px-4 py-2 border-2 border-black bg-white text-sm font-bold uppercase disabled:opacity-50">
              Request changes
            </button>
          </div>
          {data.expires_at && <p className="text-[11px] font-mono text-gray-500 mt-3">This link works until {new Date(data.expires_at).toLocaleDateString()}.</p>}
        </section>
      </main>
    </div>
  );
};

export default ReviewPage;

import React, { useState } from "react";
import { colors } from "../../lib/theme";
import {
  useAddCommentMutation,
  useDeleteCommentMutation,
  useResolveCommentMutation,
  useSceneCommentsQuery,
  type SceneComment,
} from "../../queries/scenes/useSceneCommentsQuery";

interface SceneCommentsProps {
  sceneId: number | null;
  currentUserId?: string;
}

const timeAgo = (iso: string) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
};

/** Comment threads on the selected scene (notes from producers, readers, collaborators). */
const SceneComments: React.FC<SceneCommentsProps> = ({ sceneId, currentUserId }) => {
  const { data: threads = [], isLoading } = useSceneCommentsQuery(sceneId);
  const add = useAddCommentMutation(sceneId);
  const resolve = useResolveCommentMutation(sceneId);
  const remove = useDeleteCommentMutation(sceneId);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [reply, setReply] = useState("");
  const [showResolved, setShowResolved] = useState(false);

  const visible = threads.filter((t) => showResolved || !t.resolved_at);
  const resolvedCount = threads.filter((t) => t.resolved_at).length;
  const field = "w-full border-2 border-black bg-white px-2 py-1 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    await add.mutateAsync({ body: draft.trim() });
    setDraft("");
  };

  const submitReply = async (e: React.FormEvent, parentId: number) => {
    e.preventDefault();
    if (!reply.trim()) return;
    await add.mutateAsync({ body: reply.trim(), parent_id: parentId });
    setReply("");
    setReplyTo(null);
  };

  const Comment: React.FC<{ c: SceneComment; isReply?: boolean }> = ({ c, isReply }) => (
    <div className={`${isReply ? "ml-4 pl-2 border-l-2 border-gray-200" : ""} py-1.5`}>
      <div className="flex items-baseline gap-2 text-[11px] font-mono text-gray-500">
        <span className="font-bold text-black">{c.author.name}</span>
        <span>{timeAgo(c.created_at)}</span>
        {c.author.id === currentUserId && (
          <button type="button" onClick={() => remove.mutate(c.id)} className="ml-auto hover:text-black" title="Delete">delete</button>
        )}
      </div>
      <p className="text-sm whitespace-pre-wrap">{c.body}</p>
    </div>
  );

  return (
    <div>
      {isLoading && <p className="text-xs font-mono text-gray-500">Loading comments…</p>}
      {!isLoading && threads.length === 0 && <p className="text-xs font-mono text-gray-500 mb-2">No comments on this scene yet.</p>}

      <ul className="space-y-3 mb-3">
        {visible.map((t) => (
          <li key={t.id} className={`border-2 border-black bg-white p-2 ${t.resolved_at ? "opacity-60" : ""}`}>
            <Comment c={t} />
            {(t.replies || []).map((r) => <Comment key={r.id} c={r} isReply />)}
            <div className="flex gap-3 mt-1 text-[11px] font-mono uppercase">
              <button type="button" onClick={() => { setReplyTo(replyTo === t.id ? null : t.id); setReply(""); }} className="font-bold hover:underline">Reply</button>
              <button type="button" onClick={() => resolve.mutate({ id: t.id, resolved: !t.resolved_at })} className="font-bold hover:underline" style={{ color: t.resolved_at ? colors.text.gray[500] : colors.status.green }}>
                {t.resolved_at ? "Reopen" : "Resolve"}
              </button>
            </div>
            {replyTo === t.id && (
              <form className="mt-2 flex gap-1" onSubmit={(e) => submitReply(e, t.id)}>
                <input className={field} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply…" aria-label="Reply" autoFocus />
                <button type="submit" className="px-2 border-2 border-black text-xs font-bold uppercase bg-white hover:bg-gray-100">Send</button>
              </form>
            )}
          </li>
        ))}
      </ul>

      {resolvedCount > 0 && (
        <label className="flex items-center gap-1 text-[11px] font-mono text-gray-600 mb-2">
          <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} /> show {resolvedCount} resolved
        </label>
      )}

      <form onSubmit={submit} className="flex flex-col gap-1">
        <textarea className={`${field} min-h-[56px]`} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Leave a note on this scene" aria-label="New comment" />
        <button type="submit" disabled={!draft.trim() || add.isPending} className="self-end px-3 py-1 border-2 border-black text-white text-xs font-bold uppercase disabled:opacity-50" style={{ backgroundColor: colors.primary.pink }}>
          Comment
        </button>
      </form>
    </div>
  );
};

export default SceneComments;

import React, { useMemo, useState } from "react";
import { colors } from "../../lib/theme";
import type { Scene } from "../../types/api";

interface CharactersViewProps {
  scenes: Scene[];
  onOpenScene: (sceneId: number) => void;
}

interface CharacterStats {
  name: string;
  sceneIds: number[];
  sceneNumbers: number[];
  lines: number;
  words: number;
  firstSceneNumber: number;
}

/** Characters derived from the script's cues, with where and how much they speak. */
export function characterStats(scenes: Scene[]): CharacterStats[] {
  const stats = new Map<string, CharacterStats>();
  const ordered = [...scenes].sort((a, b) => (a.order ?? a.scene_number) - (b.order ?? b.scene_number));
  ordered.forEach((scene) => {
    let speaking: string | null = null;
    (scene.elements || []).forEach((el) => {
      if (el.type === "character") {
        speaking = el.text.trim().toUpperCase();
        const entry = stats.get(speaking) || {
          name: speaking,
          sceneIds: [],
          sceneNumbers: [],
          lines: 0,
          words: 0,
          firstSceneNumber: scene.scene_number,
        };
        if (!entry.sceneIds.includes(scene.id)) {
          entry.sceneIds.push(scene.id);
          entry.sceneNumbers.push(scene.scene_number);
        }
        stats.set(speaking, entry);
      } else if (el.type === "dialogue" && speaking) {
        const entry = stats.get(speaking)!;
        entry.lines += 1;
        entry.words += el.text.trim().split(/\s+/).filter(Boolean).length;
      } else if (el.type !== "parenthetical") {
        speaking = null;
      }
    });
  });
  return [...stats.values()].sort((a, b) => b.lines - a.lines || a.firstSceneNumber - b.firstSceneNumber);
}

const CharactersView: React.FC<CharactersViewProps> = ({ scenes, onOpenScene }) => {
  const characters = useMemo(() => characterStats(scenes), [scenes]);
  const [selected, setSelected] = useState<string | null>(null);
  const active = characters.find((c) => c.name === selected) || characters[0] || null;
  const totalLines = characters.reduce((sum, c) => sum + c.lines, 0);

  if (characters.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: colors.background.beigeAlt }}>
        <div className="text-center max-w-md px-6">
          <p className="font-black uppercase text-lg">No characters yet</p>
          <p className="text-sm text-gray-600 font-mono mt-2">Characters appear here as soon as the script has character cues. Type a name in caps on its own line, or press Tab in an action block.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden" style={{ backgroundColor: colors.background.beigeAlt }}>
      <div className="w-96 bg-white border-r-2 border-black overflow-y-auto">
        <div className="px-5 py-4 border-b-2 border-black flex items-baseline justify-between">
          <h2 className="text-lg font-black uppercase tracking-tight">Characters</h2>
          <span className="text-xs font-mono text-gray-600">{characters.length} speaking · {totalLines} lines</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-gray-500 font-mono">
              <th className="text-left px-5 py-2 font-bold">Name</th>
              <th className="text-right px-2 py-2 font-bold">Scenes</th>
              <th className="text-right px-2 py-2 font-bold">Lines</th>
              <th className="text-right px-5 py-2 font-bold">Words</th>
            </tr>
          </thead>
          <tbody>
            {characters.map((c) => {
              const isActive = active?.name === c.name;
              return (
                <tr
                  key={c.name}
                  onClick={() => setSelected(c.name)}
                  className={`cursor-pointer border-t border-gray-200 ${isActive ? "text-white" : "hover:bg-gray-50"}`}
                  style={isActive ? { backgroundColor: colors.primary.pink } : undefined}
                >
                  <td className="px-5 py-2 font-mono font-bold uppercase">{c.name}</td>
                  <td className="px-2 py-2 text-right font-mono tabular-nums">{c.sceneNumbers.length}</td>
                  <td className="px-2 py-2 text-right font-mono tabular-nums">{c.lines}</td>
                  <td className="px-5 py-2 text-right font-mono tabular-nums">{c.words}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {active && (
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl">
            <h3 className="text-3xl font-black uppercase tracking-tight">{active.name}</h3>
            <div className="mt-2 flex flex-wrap gap-4 text-xs font-mono text-gray-700">
              <span>First appears in scene {active.firstSceneNumber}</span>
              <span>{active.sceneNumbers.length} of {scenes.length} scenes</span>
              <span>{active.lines} lines · {active.words} words</span>
              <span>{totalLines ? Math.round((active.lines / totalLines) * 100) : 0}% of all dialogue</span>
            </div>

            <div className="mt-6 h-2 bg-white border-2 border-black flex overflow-hidden" aria-hidden="true">
              {[...scenes]
                .sort((a, b) => (a.order ?? a.scene_number) - (b.order ?? b.scene_number))
                .map((scene) => (
                  <div
                    key={scene.id}
                    className="flex-1 border-r border-black/20 last:border-r-0"
                    style={{ backgroundColor: active.sceneIds.includes(scene.id) ? colors.primary.pink : "transparent" }}
                    title={`Scene ${scene.scene_number}`}
                  />
                ))}
            </div>
            <p className="mt-1 text-[10px] font-mono uppercase tracking-wider text-gray-500">Presence across the script</p>

            <h4 className="mt-8 text-xs font-bold uppercase tracking-wider text-gray-600">Scenes</h4>
            <ul className="mt-2 divide-y divide-gray-200 bg-white border-2 border-black">
              {[...scenes]
                .filter((s) => active.sceneIds.includes(s.id))
                .sort((a, b) => (a.order ?? a.scene_number) - (b.order ?? b.scene_number))
                .map((scene) => {
                  const lines = (scene.elements || []).reduce<{ speaking: boolean; count: number }>(
                    (acc, el) => {
                      if (el.type === "character") return { speaking: el.text.trim().toUpperCase() === active.name, count: acc.count };
                      if (el.type === "dialogue" && acc.speaking) return { ...acc, count: acc.count + 1 };
                      if (el.type !== "parenthetical" && el.type !== "dialogue") return { speaking: false, count: acc.count };
                      return acc;
                    },
                    { speaking: false, count: 0 }
                  ).count;
                  return (
                    <li key={scene.id}>
                      <button
                        type="button"
                        onClick={() => onOpenScene(scene.id)}
                        className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50"
                      >
                        <span className="font-mono text-xs text-gray-500 w-6 tabular-nums">{scene.scene_number}</span>
                        <span className="font-mono text-sm uppercase flex-1 truncate">{scene.slugline || "(no heading)"}</span>
                        <span className="font-mono text-xs text-gray-500">{lines} {lines === 1 ? "line" : "lines"}</span>
                      </button>
                    </li>
                  );
                })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default CharactersView;

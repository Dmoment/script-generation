import React, { useEffect, useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { colors } from "../../lib/theme";
import {
  useFormatPreviewQuery,
  useApplyFormatMutation,
  type FormatChange,
} from "../../queries/scripts/usePostFormatMutation";
import { sceneKeys } from "../../queries/scenes/useScenesQuery";

interface FormatScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  scriptVersionId: number;
}

type DiffViewMode = 'unified' | 'split';

const FormatScriptModal: React.FC<FormatScriptModalProps> = ({
  isOpen,
  onClose,
  scriptVersionId,
}) => {
  const [changes, setChanges] = useState<FormatChange[]>([]);
  const [totalChanges, setTotalChanges] = useState(0);
  const [expandedScenes, setExpandedScenes] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<DiffViewMode>('split');
  const queryClient = useQueryClient();

  const previewMutation = useFormatPreviewQuery();
  const applyMutation = useApplyFormatMutation();

  // Group changes by scene
  const groupedChanges = useMemo(() => {
    const groups: Map<number, FormatChange[]> = new Map();
    
    changes.forEach((change) => {
      const sceneId = change.scene_id;
      if (!groups.has(sceneId)) {
        groups.set(sceneId, []);
      }
      groups.get(sceneId)!.push(change);
    });

    return Array.from(groups.entries()).map(([sceneId, sceneChanges]) => ({
      sceneId,
      changes: sceneChanges,
    }));
  }, [changes]);

  useEffect(() => {
    if (isOpen && scriptVersionId) {
      // Reset state
      setChanges([]);
      setTotalChanges(0);
      setExpandedScenes(new Set());
      
      previewMutation.mutate(scriptVersionId, {
        onSuccess: (data) => {
          setChanges(data.changes);
          setTotalChanges(data.total_changes);
          // Expand all scenes by default
          const sceneIds = new Set(data.changes.map((c: FormatChange) => c.scene_id));
          setExpandedScenes(sceneIds);
        },
      });
    }
  }, [isOpen, scriptVersionId]);

  const toggleScene = (sceneId: number) => {
    setExpandedScenes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sceneId)) {
        newSet.delete(sceneId);
      } else {
        newSet.add(sceneId);
      }
      return newSet;
    });
  };

  const handleApply = () => {
    applyMutation.mutate(scriptVersionId, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ 
          queryKey: sceneKeys.byVersion(scriptVersionId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: sceneKeys.all 
        });

        alert(`✅ ${data.message}\n\n${data.total_changes} changes applied to ${data.scenes_updated} scenes.\n\nThe page will refresh to show updated content.`);
        
        onClose();
        window.location.reload();
      },
      onError: (error) => {
        alert(`❌ Failed to apply formatting: ${error.message}`);
      },
    });
  };

  // Render unified diff view (GitHub-style + and -)
  const renderUnifiedDiff = (group: { sceneId: number; changes: FormatChange[] }) => (
    <div className="ml-6 border-l-4" style={{ borderColor: colors.primary.pink }}>
      <table className="w-full text-sm font-mono">
        <tbody>
          {group.changes.map((change, idx) => (
            <React.Fragment key={idx}>
              {/* Removed line (red) */}
              <tr className="border-b" style={{ backgroundColor: '#FEE2E2', borderColor: '#FECACA' }}>
                <td className="w-12 px-2 py-1.5 text-right select-none border-r text-xs font-bold" style={{ color: colors.primary.pink, borderColor: '#FECACA' }}>
                  {change.element_index === -1 ? 'SL' : change.element_index + 1}
                </td>
                <td className="w-8 px-2 py-1.5 text-center font-bold select-none" style={{ color: '#DC2626' }}>
                  −
                </td>
                <td className="px-3 py-1.5">
                  <span className="text-xs mr-2 font-sans" style={{ color: colors.primary.pink }}>
                    [{change.original.type}]
                  </span>
                  <span className="px-1 rounded" style={{ backgroundColor: '#FECACA', color: '#991B1B' }}>
                    {change.original.text}
                  </span>
                </td>
              </tr>
              {/* Added line (green) */}
              <tr className="border-b" style={{ backgroundColor: '#D1FAE5', borderColor: '#A7F3D0' }}>
                <td className="w-12 px-2 py-1.5 text-right select-none border-r text-xs font-bold" style={{ color: colors.status.green, borderColor: '#A7F3D0' }}>
                  {change.element_index === -1 ? 'SL' : change.element_index + 1}
                </td>
                <td className="w-8 px-2 py-1.5 text-center font-bold select-none" style={{ color: colors.status.green }}>
                  +
                </td>
                <td className="px-3 py-1.5">
                  <span className="text-xs mr-2 font-sans" style={{ color: colors.status.green }}>
                    [{change.formatted.type}]
                  </span>
                  <span className="px-1 rounded" style={{ backgroundColor: '#A7F3D0', color: '#065F46' }}>
                    {change.formatted.text}
                  </span>
                </td>
              </tr>
              {/* Separator between changes */}
              {idx < group.changes.length - 1 && (
                <tr>
                  <td colSpan={3} className="h-2" style={{ backgroundColor: colors.background.beige }}></td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Render split/side-by-side diff view (table format with line numbers)
  const renderSplitDiff = (group: { sceneId: number; changes: FormatChange[] }) => (
    <div className="ml-6 border-l-4 overflow-x-auto" style={{ borderColor: colors.primary.pink }}>
      <table className="w-full text-sm font-mono border-collapse">
        {/* Table header */}
        <thead>
          <tr className="border-b-2" style={{ backgroundColor: colors.background.beige, borderColor: 'black' }}>
            <th className="w-12 px-2 py-2 text-center text-xs font-bold border-r" style={{ color: colors.text.black, borderColor: colors.background.gray[300] }}>
              #
            </th>
            <th className="w-20 px-2 py-2 text-center text-xs font-bold border-r" style={{ color: colors.text.black, borderColor: colors.background.gray[300] }}>
              TYPE
            </th>
            <th className="px-3 py-2 text-left text-xs font-bold border-r" style={{ backgroundColor: '#FEE2E2', color: '#991B1B', borderColor: colors.background.gray[300] }}>
              BEFORE
            </th>
            <th className="px-3 py-2 text-left text-xs font-bold" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
              AFTER
            </th>
          </tr>
        </thead>
        <tbody>
          {group.changes.map((change, idx) => (
            <tr 
              key={idx} 
              className="border-b"
              style={{ 
                backgroundColor: idx % 2 === 0 ? colors.background.white : colors.background.beige,
                borderColor: colors.background.gray[200]
              }}
            >
              {/* Line number */}
              <td className="w-12 px-2 py-2 text-center text-xs border-r font-bold" style={{ color: colors.primary.pink, borderColor: colors.background.gray[200] }}>
                {change.element_index === -1 ? 'SL' : change.element_index + 1}
              </td>
              
              {/* Type change indicator */}
              <td className="w-20 px-2 py-2 text-center text-xs border-r" style={{ borderColor: colors.background.gray[200] }}>
                {change.original.type !== change.formatted.type ? (
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="line-through" style={{ color: '#DC2626' }}>{change.original.type}</span>
                    <span style={{ color: colors.status.green }}>{change.formatted.type}</span>
                  </div>
                ) : (
                  <span style={{ color: colors.text.gray[500] }}>{change.original.type}</span>
                )}
              </td>
              
              {/* Before text */}
              <td className="px-3 py-2 border-r" style={{ backgroundColor: '#FEF2F2', borderColor: colors.background.gray[200] }}>
                <span className="px-1 rounded whitespace-pre-wrap break-words" style={{ backgroundColor: '#FECACA', color: '#991B1B' }}>
                  {change.original.text || '(empty)'}
                </span>
              </td>
              
              {/* After text */}
              <td className="px-3 py-2" style={{ backgroundColor: '#ECFDF5' }}>
                <span className="px-1 rounded whitespace-pre-wrap break-words" style={{ backgroundColor: '#A7F3D0', color: '#065F46' }}>
                  {change.formatted.text || '(empty)'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="rounded-lg border-2 shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col"
        style={{ backgroundColor: colors.background.white, borderColor: 'black' }}
      >
        {/* Header */}
        <div 
          className="px-6 py-4 border-b-2 flex items-center justify-between"
          style={{ backgroundColor: colors.background.beige, borderColor: 'black' }}
        >
          <div className="flex items-center gap-4">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: colors.primary.pink }}
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold uppercase tracking-wide" style={{ color: colors.text.black }}>
                Format Script
              </h2>
              <p className="text-sm" style={{ color: colors.text.gray[600] }}>
                Preview formatting changes before applying
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            {totalChanges > 0 && (
              <div className="flex rounded-lg border-2 overflow-hidden" style={{ borderColor: 'black' }}>
                <button
                  onClick={() => setViewMode('split')}
                  className="px-3 py-1.5 text-xs font-bold uppercase transition-colors"
                  style={{ 
                    backgroundColor: viewMode === 'split' ? colors.primary.pink : colors.background.white,
                    color: viewMode === 'split' ? 'white' : colors.text.gray[600]
                  }}
                  title="Side-by-side view"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('unified')}
                  className="px-3 py-1.5 text-xs font-bold uppercase transition-colors border-l-2"
                  style={{ 
                    backgroundColor: viewMode === 'unified' ? colors.primary.pink : colors.background.white,
                    color: viewMode === 'unified' ? 'white' : colors.text.gray[600],
                    borderColor: 'black'
                  }}
                  title="Unified view"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
              </div>
            )}
            
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto" style={{ backgroundColor: colors.background.beige }}>
          {previewMutation.isPending ? (
            <div className="flex items-center justify-center py-20">
              <div 
                className="animate-spin rounded-full h-10 w-10 border-b-2"
                style={{ borderColor: colors.primary.pink }}
              ></div>
              <span className="ml-4 text-lg" style={{ color: colors.text.gray[600] }}>Analyzing script...</span>
            </div>
          ) : previewMutation.isError ? (
            <div className="text-center py-20">
              <div className="text-xl font-bold" style={{ color: colors.status.red }}>Error loading preview</div>
              <p className="mt-2" style={{ color: colors.text.gray[600] }}>{previewMutation.error?.message}</p>
            </div>
          ) : totalChanges === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-6">✨</div>
              <div className="text-2xl font-bold" style={{ color: colors.status.green }}>Script is already formatted!</div>
              <p className="mt-3 text-lg" style={{ color: colors.text.gray[600] }}>No changes needed.</p>
            </div>
          ) : (
            <div>
              {/* Summary Bar */}
              <div 
                className="px-6 py-3 border-b flex items-center justify-between"
                style={{ backgroundColor: colors.background.white, borderColor: colors.background.gray[300] }}
              >
                <div className="flex items-center gap-4">
                  <span className="font-bold text-lg" style={{ color: colors.primary.pink }}>
                    {totalChanges} change{totalChanges !== 1 ? 's' : ''} 
                  </span>
                  <span style={{ color: colors.text.gray[600] }}>
                    in {groupedChanges.length} scene{groupedChanges.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="text-xs" style={{ color: colors.text.gray[500] }}>
                  {viewMode === 'split' ? 'Side-by-side view' : 'Unified view'}
                </div>
              </div>

              {/* Grouped Changes by Scene */}
              <div className="divide-y" style={{ borderColor: colors.background.gray[200] }}>
                {groupedChanges.map((group) => (
                  <div key={group.sceneId} style={{ backgroundColor: colors.background.white }}>
                    {/* Scene Header */}
                    <button
                      onClick={() => toggleScene(group.sceneId)}
                      className="w-full px-6 py-3 flex items-center justify-between text-left transition-colors border-b hover:opacity-80"
                      style={{ backgroundColor: colors.background.beige, borderColor: colors.background.gray[200] }}
                    >
                      <div className="flex items-center gap-3">
                        <svg 
                          className={`w-4 h-4 transition-transform ${expandedScenes.has(group.sceneId) ? 'rotate-90' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                          style={{ color: colors.primary.pink }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="font-mono font-bold text-sm" style={{ color: colors.text.black }}>
                          Scene {group.sceneId}
                        </span>
                        <span 
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: colors.primary.pink, color: 'white' }}
                        >
                          {group.changes.length} change{group.changes.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </button>

                    {/* Scene Changes (expanded) */}
                    {expandedScenes.has(group.sceneId) && (
                      viewMode === 'unified' 
                        ? renderUnifiedDiff(group)
                        : renderSplitDiff(group)
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div 
          className="px-6 py-4 border-t-2 flex items-center justify-between"
          style={{ backgroundColor: colors.background.beige, borderColor: 'black' }}
        >
          <div className="text-sm" style={{ color: colors.text.gray[600] }}>
            {totalChanges > 0 && (
              <span>
                Review changes carefully before applying
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-white border-2 rounded font-bold uppercase text-sm hover:bg-gray-100 transition-colors"
              style={{ borderColor: 'black', color: colors.text.black }}
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={totalChanges === 0 || applyMutation.isPending}
              className="px-5 py-2 text-white border-2 rounded font-bold uppercase text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: totalChanges === 0 ? '#ccc' : colors.primary.pink,
                borderColor: 'black'
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = colors.primary.pinkDark;
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = colors.primary.pink;
                }
              }}
            >
              {applyMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Applying...
                </span>
              ) : (
                `Apply ${totalChanges} Change${totalChanges !== 1 ? 's' : ''}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormatScriptModal;

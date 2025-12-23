import React from "react";
import { colors } from "../../lib/theme";

interface ScriptEditorActionsProps {
  onFinishLater: () => void;
  onBack: () => void;
  onAcceptAndProceed: () => void;
}

const ScriptEditorActions: React.FC<ScriptEditorActionsProps> = ({
  onFinishLater,
  onBack,
  onAcceptAndProceed,
}) => {
  return (
    <div className="bg-white border-t-2 border-black px-6 py-3 flex items-center justify-end gap-3 shadow-[0_-2px_0_0_rgba(0,0,0,1)]">
      <button
        onClick={onFinishLater}
        className="px-4 py-2 text-black bg-white border-2 border-black rounded font-bold uppercase text-sm hover:bg-gray-100 transition-colors"
      >
        Finish later
      </button>
      <button
        onClick={onBack}
        className="px-4 py-2 text-white bg-black border-2 border-black rounded font-bold uppercase text-sm hover:bg-gray-800 transition-colors"
      >
        Back
      </button>
      <button
        onClick={onAcceptAndProceed}
        className="px-4 py-2 text-white border-2 border-black rounded font-bold uppercase text-sm transition-colors"
        style={{ backgroundColor: colors.primary.pink }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.primary.pinkDark;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = colors.primary.pink;
        }}
      >
        Accept and proceed
      </button>
    </div>
  );
};

export default ScriptEditorActions;


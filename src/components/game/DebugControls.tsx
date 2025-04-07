import React from "react";
import { useGameStore } from "../../store/gameStore";

interface DebugControlsProps {
  visible?: boolean;
}

const DebugControls: React.FC<DebugControlsProps> = ({ visible = true }) => {
  const {
    history = [],
    historyIndex = -1,
    isReplayMode = false,
    goBackInHistory,
    goForwardInHistory,
    exitReplayMode,
  } = useGameStore();

  if (!visible) return null;

  const totalSteps = history?.length || 0;
  const currentStep = historyIndex + 1 || 0; // Make it 1-indexed for display
  const canGoBack = historyIndex > 0;
  const canGoForward =
    isReplayMode && historyIndex < (history?.length || 0) - 1;

  const getCurrentActionInfo = () => {
    if (!history || history.length === 0 || historyIndex < 0)
      return "No actions recorded";

    try {
      const entry = history[historyIndex];
      if (!entry) return "No entry at current index";

      return `${entry.action.type} - ${JSON.stringify(
        entry.action.payload || {}
      ).substring(0, 50)}${
        JSON.stringify(entry.action.payload || {}).length > 50 ? "..." : ""
      }`;
    } catch (error) {
      console.error("Error getting action info:", error);
      return "Error displaying action info";
    }
  };

  return (
    <div className="bg-slate-900 text-slate-200 p-4 rounded-lg shadow-xl border border-slate-700 max-w-md">
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm">
          <span className="font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Debug Controls
          </span>
          {isReplayMode && (
            <span className="ml-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">
              Replay Mode
            </span>
          )}
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-3 mb-3">
        <div className="text-xs text-slate-400 mb-2">Action Information:</div>
        <div className="text-sm text-slate-300 font-mono bg-slate-900 p-2 rounded overflow-x-auto">
          {getCurrentActionInfo()}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={goBackInHistory}
          disabled={!canGoBack}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            canGoBack
              ? "bg-indigo-600 hover:bg-indigo-500 text-white"
              : "bg-slate-700 text-slate-400 cursor-not-allowed"
          }`}
        >
          ← Previous
        </button>

        <div className="text-sm bg-slate-800 px-3 py-1 rounded-md">
          {currentStep} / {totalSteps}
        </div>

        <button
          onClick={goForwardInHistory}
          disabled={!canGoForward}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            canGoForward
              ? "bg-indigo-600 hover:bg-indigo-500 text-white"
              : "bg-slate-700 text-slate-400 cursor-not-allowed"
          }`}
        >
          Next →
        </button>
      </div>

      {isReplayMode && (
        <button
          onClick={exitReplayMode}
          className="w-full mt-3 px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md text-sm font-medium transition-colors"
        >
          Exit Replay Mode
        </button>
      )}
    </div>
  );
};

export default DebugControls;

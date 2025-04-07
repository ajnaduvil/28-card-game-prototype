import React from "react";
import { useGameStore } from "../../store/gameStore";

interface DebugControlsProps {
  visible: boolean;
}

const DebugControls: React.FC<DebugControlsProps> = ({ visible }) => {
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
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-2 shadow-lg border-t border-gray-700 z-50">
      <div className="flex justify-between items-center">
        <div className="text-sm">
          <span className="font-bold text-purple-400">Debug Mode</span>
          {isReplayMode && (
            <span className="ml-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">
              Replay Mode
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={goBackInHistory}
            disabled={!canGoBack}
            className={`px-3 py-1 rounded text-sm ${
              canGoBack
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-700 cursor-not-allowed"
            }`}
          >
            ← Back
          </button>

          <div className="text-sm">
            {currentStep} / {totalSteps}
          </div>

          <button
            onClick={goForwardInHistory}
            disabled={!canGoForward}
            className={`px-3 py-1 rounded text-sm ${
              canGoForward
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-700 cursor-not-allowed"
            }`}
          >
            Forward →
          </button>

          {isReplayMode && (
            <button
              onClick={exitReplayMode}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm ml-4"
            >
              Exit Replay Mode
            </button>
          )}
        </div>
      </div>

      <div className="mt-1 text-xs text-gray-400 overflow-hidden">
        <span className="font-semibold">Current Action: </span>
        {getCurrentActionInfo()}
      </div>
    </div>
  );
};

export default DebugControls;

"use client";

import { AlertTriangle, RefreshCw, X, Sparkles } from "lucide-react";

interface RegenerateConfirmModalProps {
  isOpen: boolean;
  isRegenerating: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function RegenerateConfirmModal({
  isOpen,
  isRegenerating,
  onConfirm,
  onClose,
}: RegenerateConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#0c1222] border border-white/10 rounded-2xl p-6 shadow-2xl shadow-indigo-950/50"
      >
        {/* Close Button */}
        <button
          type="button"
          disabled={isRegenerating}
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
            <RefreshCw className={`w-6 h-6 ${isRegenerating ? "animate-spin" : ""}`} />
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">
              Regenerate Placement Roadmap?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              PlacementAI will synthesize a fresh 4-week preparation plan based on your latest skills, DSA progress, and resume evaluation.
            </p>
            <div className="mt-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <span>
                Your current roadmap and task completion progress will be replaced by the new roadmap.
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
          <button
            type="button"
            disabled={isRegenerating}
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isRegenerating}
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02] disabled:opacity-50 cursor-pointer"
          >
            {isRegenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Generating Roadmap...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Yes, Regenerate</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

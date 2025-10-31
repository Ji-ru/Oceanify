import React from 'react';

const RescueModal = ({
  showRescueConfirm,
  rescueCountdown,
  rescuePendingLocation,
  rescuePendingReason,
  confirmRescue,
  cancelRescue
}) => {
  if (!showRescueConfirm || !rescuePendingLocation) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="w-full max-w-lg p-7 border-4 border-red-500 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-[0_24px_80px_rgba(239,68,68,0.25)]">
        <div className="mb-4 text-center">
          <div className="mb-2 text-6xl">🆘</div>
          <h2 className="mb-1 text-lg font-bold text-white">
            CONFIRM EMERGENCY RESCUE
          </h2>
          <p className="text-sm text-gray-400">
            Auto-sending in {rescueCountdown} second
            {rescueCountdown !== 1 ? "s" : ""}...
          </p>
        </div>

        <div className="p-3 mb-4 text-white rounded-lg bg-white/5">
          <p className="mb-1">
            <strong>📍 Location:</strong> {rescuePendingLocation.lat.toFixed(4)}, {rescuePendingLocation.lng.toFixed(4)}
          </p>
          <p className="text-xs text-gray-300">
            Reason: <strong className="text-white">{rescuePendingReason}</strong>
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => confirmRescue(null, null)}
            className="flex-1 py-3 font-bold text-white transition-all duration-200 rounded-lg bg-gradient-to-br from-red-500 to-red-600 hover:scale-105"
          >
            SEND NOW
          </button>
          <button
            onClick={cancelRescue}
            className="flex-1 py-3 font-bold text-white transition-all duration-200 bg-gray-600 rounded-lg hover:scale-105"
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
};

export default RescueModal;
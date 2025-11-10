import React from "react";

const ControlPanel = ({
  visible,
  onClose,
  showTemperature,
  showPressure,
  showStorm,
  showPorts,
  onToggleTemperature,
  onTogglePressure,
  onToggleStorm,
  onTogglePorts,
}) => {
  if (!visible) return null;

  const ControlItem = ({ icon, label, description, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`w-full px-4 py-3 rounded-xl text-white transition-all duration-200 text-left group ${
        isActive ? "bg-[#272727]" : "bg-[#1e1e1e] hover:bg-[#323232]"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="text-xl">{icon}</div>
        <div className="flex-1">
          <div className="text-sm font-semibold">{label}</div>
          <div className="text-xs text-gray-400">
            {isActive ? "Layer visible on map" : "Layer hidden"}
          </div>
        </div>
        <div
          className={`w-3 h-3 rounded-full transition-all duration-200 ${
            isActive ? "bg-green-500" : "bg-gray-600"
          }`}
        ></div>
      </div>
    </button>
  );

  return (
    <div className="fixed top-0 bottom-0 right-24 w-80 animate-in slide-in-from-right">
      {/* Backdrop that closes panel when clicking outside */}
      <div className="absolute inset-0 bg-transparent" onClick={onClose} />

      {/* Panel content - positioned to the right */}
      <div className="absolute top-24 right-4 w-80">
        <div className="bg-[#1e1e1e] border-1 border-neutral-600 rounded-xl">
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-white">MAP LAYERS</h3>
              </div>
            </div>

            {/* Control Items */}
            <div className="space-y-2">
              <ControlItem
                icon="🌡️"
                label="Temperature"
                description="Temperature layer"
                isActive={showTemperature}
                onClick={onToggleTemperature}
              />

              <ControlItem
                icon="📊"
                label="Pressure"
                description="Pressure layer"
                isActive={showPressure}
                onClick={onTogglePressure}
              />

              <ControlItem
                icon="⛈️"
                label="Storm Layers"
                description="Storm layers"
                isActive={showStorm}
                onClick={onToggleStorm}
              />

              <ControlItem
                icon="⚓"
                label="Ports"
                description="Port markers"
                isActive={showPorts}
                onClick={onTogglePorts}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;

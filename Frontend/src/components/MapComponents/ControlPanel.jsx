import React from 'react';

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
  onLogout
}) => {
  if (!visible) return null;

  const ControlItem = ({ icon, label, description, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`w-full px-4 py-2 rounded-2xl font-semibold text-white transition-all duration-300 border-2 backdrop-blur-sm text-left group ${
        isActive
          ? "bg-gradient-to-br from-white/20 to-white/10 border-white/40 shadow-lg"
          : "bg-white/5 border-white/25 hover:bg-white/10 hover:border-white/35"
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`text-2xl transition-transform duration-300 group-hover:scale-110 ${isActive ? "scale-110" : "scale-100"}`}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="mb-1 text-sm font-semibold">{label}</div>
          <div className="text-xs opacity-70">
            {isActive ? "Layer visible on map" : "Layer hidden"}
          </div>
        </div>
        <div className={`w-3 h-3 rounded-full border-2 border-white/50 transition-all duration-300 ${
          isActive ? "bg-green-400/80 border-green-400" : "bg-transparent"
        }`}></div>
      </div>
    </button>
  );

  return (
    <div className="fixed duration-300 top-52 right-4 z-1000 w-80 animate-in slide-in-from-right">
      <div className="border shadow-2xl bg-gradient-to-br from-white/10 to-white/5 border-white/20 rounded-2xl backdrop-blur-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full shadow-lg bg-white/80"></div>
              <h3 className="text-xs font-semibold tracking-wide text-white">MAP LAYERS</h3>
            </div>
            <button onClick={onClose} className="flex items-center justify-center w-6 h-6 transition-all duration-200 border rounded-full bg-white/10 hover:bg-white/20 border-white/20">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Control Items */}
          <div className="flex gap-1.5 flex-column">
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

            {/* Logout Button */}
            <div className="pt-2">
              <button
                onClick={onLogout}
                className="w-full px-4 py-2 rounded-4 font-semibold text-white transition-all duration-300 border-2 border-white/25 bg-white/5 backdrop-blur-sm text-left group hover:bg-red-500/20 hover:border-red-400/50 hover:scale-[1.02]"
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl transition-transform duration-300 group-hover:scale-110">←</div>
                  <div className="flex-1">
                    <div className="mb-1 text-sm font-semibold">Account Logout</div>
                    <div className="text-xs opacity-70">Return to login screen</div>
                  </div>
                  <div className="w-3 h-3 bg-transparent border-2 rounded-full border-white/50"></div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
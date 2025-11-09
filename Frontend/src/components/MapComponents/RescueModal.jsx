import { X, AlertTriangle, MapPin, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const RESCUE_REASONS = [
  { value: "sinking", label: "🌊 Sinking Vessel", description: "Ship is taking on water" },
  { value: "engine_failure", label: "⚙️ Engine Failure", description: "Propulsion system malfunction" },
  { value: "medical_emergency", label: "🏥 Medical Emergency", description: "Crew member needs urgent care" },
  { value: "fire", label: "🔥 Fire Onboard", description: "Fire or explosion hazard" },
  { value: "collision", label: "💥 Collision", description: "Vessel collision or damage" },
  { value: "man_overboard", label: "🆘 Man Overboard", description: "Person in water" },
  { value: "severe_weather", label: "⛈️ Severe Weather", description: "Storm or dangerous conditions" },
  { value: "grounding", label: "🪨 Grounding", description: "Vessel run aground" },
  { value: "other", label: "⚠️ Other Emergency", description: "Other urgent situation" },
];

export default function RescueModal({
  showRescueModal,
  rescueLocation,
  rescueReason,
  setRescueReason,
  isSubmitting,
  submitRescue,
  cancelRescue,
}) {
  if (!showRescueModal) return null;

  return (
    <AnimatePresence>
      <motion.aside
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="rescue-modal-title"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden rounded-3xl border border-red-500/30 bg-gradient-to-br from-red-950/90 via-black/80 to-orange-950/80 shadow-[0_0_50px_rgba(255,0,0,0.15)]"
        >
          {/* Header */}
          <header className="relative flex items-center gap-4 p-6 border-b border-red-500/20 bg-gradient-to-r from-red-900/40 to-transparent flex-shrink-0">
            <div className="flex items-center justify-center w-14 h-14 bg-red-600/80 rounded-full shadow-lg shadow-red-600/40 animate-pulse">
              <AlertTriangle className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 id="rescue-modal-title" className="text-2xl font-extrabold text-white tracking-tight">
                Emergency Rescue Request
              </h2>
              <p className="text-sm text-red-200/80">
                Submit an emergency distress signal to the Coast Guard
              </p>
            </div>
            <button
              onClick={cancelRescue}
              disabled={isSubmitting}
              aria-label="Close modal"
              className="absolute top-5 right-5 text-white/80 hover:text-red-300 transition-colors disabled:opacity-40"
            >
              <X className="w-6 h-6" />
            </button>
          </header>

          {/* Scrollable Content */}
          <main className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
            {/* Location Info */}
            {rescueLocation && (
              <section className="rounded-2xl border border-red-500/20 bg-red-900/20 p-4 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-2 text-white">
                  <MapPin className="w-4 h-4 text-red-300" />
                  <span className="text-sm font-semibold uppercase tracking-wide">Emergency Location</span>
                </div>
                <address className="not-italic text-sm text-red-200/90 space-y-1">
                  <p>Latitude: {rescueLocation.lat.toFixed(6)}° N</p>
                  <p>Longitude: {rescueLocation.lng.toFixed(6)}° E</p>
                </address>
              </section>
            )}

            {/* Emergency Reasons */}
            <section>
              <label className="block mb-3 text-sm font-semibold text-white tracking-wide">
                Select Emergency Type *
              </label>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {RESCUE_REASONS.map((reason) => {
                  const selected = rescueReason === reason.value;
                  return (
                    <li key={reason.value}>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setRescueReason(reason.value)}
                        disabled={isSubmitting}
                        className={`relative w-full p-4 text-left rounded-2xl border transition-all duration-300 backdrop-blur-sm ${
                          selected
                            ? "border-red-500 bg-red-800/50 shadow-[0_0_15px_rgba(255,0,0,0.3)]"
                            : "border-white/10 bg-white/5 hover:border-red-600/50 hover:bg-red-950/30"
                        } disabled:opacity-50`}
                        aria-pressed={selected}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-base font-semibold text-white">{reason.label}</span>
                            <p className="text-xs text-red-200/80">{reason.description}</p>
                          </div>
                          {selected && (
                            <CheckCircle className="w-5 h-5 text-red-400 mt-1" />
                          )}
                        </div>
                      </motion.button>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* Warning Box */}
            <section className="p-4 border border-yellow-500/40 bg-yellow-900/10 rounded-2xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="flex-shrink-0 w-5 h-5 text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-yellow-200 mb-1">Emergency Use Only</p>
                  <p className="text-xs text-yellow-300/80 leading-relaxed">
                    Submitting false or non-emergency requests may result in serious penalties.
                    Emergency responders will be dispatched immediately to your provided location.
                  </p>
                </div>
              </div>
            </section>
          </main>

          {/* Footer */}
          <footer className="flex gap-3 p-6 border-t border-red-500/20 bg-gradient-to-r from-red-900/30 to-transparent flex-shrink-0">
            <button
              onClick={cancelRescue}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 text-white font-medium bg-gray-700/80 rounded-xl hover:bg-gray-600/80 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={submitRescue}
              disabled={isSubmitting || !rescueReason}
              className="flex-1 px-6 py-3 font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-all shadow-md hover:shadow-red-600/30 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  🆘 Send Rescue Request
                </span>
              )}
            </button>
          </footer>
        </motion.div>
      </motion.aside>
    </AnimatePresence>
  );
}

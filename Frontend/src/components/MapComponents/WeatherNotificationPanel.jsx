import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  RefreshCw,
  MapPin,
  Ship,
  Anchor,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { useWeatherAlerts } from "../../hooks/useWeatherAlerts";
import {
  getSeverityConfig,
  SEVERITY,
} from "../../services/weatherAlertService";

// Design tokens for consistent styling
const STYLES = {
  bg: {
    primary: "bg-[#0f0f0f]",
    card: "bg-[#1e1e1e]",
    secondary: "bg-[#272727]",
    overlay: "bg-[#1e1e1e]",
  },
  text: {
    primary: "text-white",
    secondary: "text-gray-300",
    muted: "text-gray-400",
    danger: "text-red-400",
    warning: "text-orange-400",
    caution: "text-yellow-400",
    success: "text-green-400",
    info: "text-blue-400",
  },
  border: {
    default: "border-white/10",
    danger: "border-red-500/30",
    warning: "border-orange-500/30",
    caution: "border-yellow-500/30",
    success: "border-green-500/30",
  },
  spacing: {
    xs: "p-1.5",
    sm: "p-2",
    md: "p-3",
    lg: "p-4",
    xl: "p-6",
  },
  radius: {
    sm: "rounded-lg",
    md: "rounded-xl",
    lg: "rounded-2xl",
  },
};

export default function WeatherNotificationPanel({ onShowAlerts }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTab, setSelectedTab] = useState("overview");

  const {
    userLocationAlert,
    alertSummary,
    loading,
    error,
    lastUpdate,
    refreshAlerts,
    getAlertsBySeverity,
  } = useWeatherAlerts({
    updateInterval: 30 * 60 * 1000,
    monitorPorts: true,
    monitorUserLocation: true,
  });

  // Get overall severity
  const overallSeverity =
    userLocationAlert?.overallSeverity ||
    (alertSummary?.danger > 0
      ? SEVERITY.DANGER
      : alertSummary?.warning > 0
      ? SEVERITY.WARNING
      : alertSummary?.caution > 0
      ? SEVERITY.CAUTION
      : SEVERITY.SAFE);

  const severityConfig = getSeverityConfig(overallSeverity);

  const formatLastUpdate = () => {
    if (!lastUpdate) return "Never";
    const minutes = Math.floor((new Date() - lastUpdate) / 60000);
    if (minutes < 1) return "Now";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  // Enhanced button component for consistency
  const IconButton = ({
    icon: Icon,
    onClick,
    title,
    disabled = false,
    className = "",
  }) => (
    <button
      onClick={onClick}
      className={`${STYLES.spacing.xs} hover:bg-white/10 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-white ${className}`}
      disabled={disabled}
      title={title}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );

  const renderCompactHeader = () => (
    <div className="flex items-center justify-between p-3">
      <div className="flex items-center gap-2">
        <div
          className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-sm border-2 rounded-full"
          style={{
            backgroundColor: severityConfig.bgColor,
            color: severityConfig.color,
            borderColor: severityConfig.borderColor,
          }}
        >
          {severityConfig.icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">
              Maritime Alert
            </span>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-bold"
              style={{
                backgroundColor: severityConfig.color,
                color: "white",
              }}
            >
              {severityConfig.label}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{loading ? "Updating..." : formatLastUpdate()}</span>
            {alertSummary && (
              <span className="ml-1">• {alertSummary.total} locs</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <IconButton
          icon={RefreshCw}
          onClick={(e) => {
            e.stopPropagation();
            refreshAlerts();
          }}
          disabled={loading}
          className={loading ? "animate-spin" : ""}
        />
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-white" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white" />
        )}
      </div>
    </div>
  );

  const renderQuickStats = () => (
    <div className="flex gap-1 px-3 pb-3">
      {alertSummary?.danger > 0 && (
        <div
          className={`flex items-center gap-1 px-2 py-1 text-xs font-medium border rounded ${STYLES.border.danger} bg-red-500/20`}
        >
          <span className="font-semibold text-red-400">
            {alertSummary.danger}
          </span>
          <span className="text-red-300">Danger</span>
        </div>
      )}
      {alertSummary?.warning > 0 && (
        <div
          className={`flex items-center gap-1 px-2 py-1 text-xs font-medium border rounded ${STYLES.border.warning} bg-orange-500/20`}
        >
          <span className="font-semibold text-orange-400">
            {alertSummary.warning}
          </span>
          <span className="text-orange-300">Warning</span>
        </div>
      )}
      {alertSummary?.caution > 0 && (
        <div
          className={`flex items-center gap-1 px-2 py-1 text-xs font-medium border rounded ${STYLES.border.caution} bg-yellow-500/20`}
        >
          <span className="font-semibold text-yellow-400">
            {alertSummary.caution}
          </span>
          <span className="text-yellow-300">Caution</span>
        </div>
      )}
    </div>
  );

  const renderExpandedHeader = () => (
    <div className="flex items-center justify-between p-3 border-b border-white/10">
      <div className="flex items-center gap-2">
        <div
          className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-sm border-2 rounded-full"
          style={{
            backgroundColor: severityConfig.bgColor,
            color: severityConfig.color,
            borderColor: severityConfig.borderColor,
          }}
        >
          {severityConfig.icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">
              Maritime Alert
            </span>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-bold"
              style={{
                backgroundColor: severityConfig.color,
                color: "white",
              }}
            >
              {severityConfig.label}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{loading ? "Updating..." : formatLastUpdate()}</span>
            {alertSummary && (
              <span className="ml-1">• {alertSummary.total} locs</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <IconButton
          icon={AlertTriangle}
          onClick={(e) => {
            e.stopPropagation();
            onShowAlerts?.();
          }}
          title="Show Alerts"
          className="text-orange-400"
        />
        <IconButton
          icon={RefreshCw}
          onClick={(e) => {
            e.stopPropagation();
            refreshAlerts();
          }}
          disabled={loading}
          className={loading ? "animate-spin" : ""}
        />
        <IconButton
          icon={ChevronUp}
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(false);
          }}
        />
      </div>
    </div>
  );

  const renderIssues = (issues) => {
    if (!issues || issues.length === 0) return null;

    return (
      <div className="space-y-1.5 mt-2">
        {issues.slice(0, 2).map((issue, idx) => {
          const issueConfig = getSeverityConfig(issue.severity);
          return (
            <div
              key={idx}
              className="flex items-start gap-1.5 p-2 rounded text-xs border-l-2"
              style={{
                backgroundColor: issueConfig.bgColor,
                borderLeftColor: issueConfig.color,
              }}
            >
              <span className="text-xs mt-0.5 flex-shrink-0">
                {issueConfig.icon}
              </span>
              <span
                className="leading-relaxed"
                style={{ color: issueConfig.color }}
              >
                {issue.message}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderOverviewTab = () => (
    <div className="space-y-3">
      {/* User Location Summary */}
      {userLocationAlert && (
        <div
          className={`p-3  rounded-lg ${STYLES.bg.secondary} ${STYLES.border.default} backdrop-blur-sm`}
        >
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Your Location</h3>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="text-gray-400">Weather</div>
              <div className="font-medium text-white truncate">
                {userLocationAlert.weather?.weatherDescription}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Temp</div>
              <div className="font-medium text-white">
                {userLocationAlert.weather?.temperature?.toFixed(0)}°C
              </div>
            </div>
            {userLocationAlert.waves && (
              <>
                <div>
                  <div className="text-gray-400">Waves</div>
                  <div className="font-medium text-white">
                    {userLocationAlert.waves.waveHeight?.toFixed(1)}m
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">Swell</div>
                  <div className="font-medium text-white">
                    {userLocationAlert.waves.swellHeight?.toFixed(1)}m
                  </div>
                </div>
              </>
            )}
          </div>

          {renderIssues([
            ...(userLocationAlert.weather?.issues || []),
            ...(userLocationAlert.waves?.issues || []),
          ])}
        </div>
      )}

      {/* Quick Stats Grid */}
      {alertSummary && (
        <div className="grid grid-cols-4 gap-2">
          <div
            className={`p-2 text-center  rounded ${STYLES.border.danger} bg-red-500/10 backdrop-blur-sm`}
          >
            <div className="text-lg font-bold text-red-400">
              {alertSummary.danger}
            </div>
            <div className="text-xs text-red-300">Danger</div>
          </div>
          <div
            className={`p-2 text-center  rounded ${STYLES.border.warning} bg-orange-500/10 backdrop-blur-sm`}
          >
            <div className="text-lg font-bold text-orange-400">
              {alertSummary.warning}
            </div>
            <div className="text-xs text-orange-300">Warning</div>
          </div>
          <div
            className={`p-2 text-center  rounded ${STYLES.border.caution} bg-yellow-500/10 backdrop-blur-sm`}
          >
            <div className="text-lg font-bold text-yellow-400">
              {alertSummary.caution}
            </div>
            <div className="text-xs text-yellow-300">Caution</div>
          </div>
          <div
            className={`p-2 text-center  rounded ${STYLES.border.success} bg-green-500/10 backdrop-blur-sm`}
          >
            <div className="text-lg font-bold text-green-400">
              {alertSummary.safe}
            </div>
            <div className="text-xs text-green-300">Safe</div>
          </div>
        </div>
      )}
    </div>
  );

  const renderRecommendationsTab = (vesselType) => {
    const alert = userLocationAlert;
    if (!alert)
      return (
        <div className="py-6 text-xs text-center text-gray-400">
          No location data
        </div>
      );

    const recommendations = alert.recommendations[vesselType];
    const Icon = vesselType === "fishing" ? Anchor : Ship;

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <Icon className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white capitalize">
            {vesselType} Vessels
          </h3>
        </div>

        {/* Severity Card */}
        <div
          className="p-3 border rounded-lg backdrop-blur-sm"
          style={{
            backgroundColor: severityConfig.bgColor,
            borderColor: severityConfig.borderColor,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{severityConfig.icon}</span>
            <span
              className="text-sm font-bold"
              style={{ color: severityConfig.color }}
            >
              {severityConfig.label}
            </span>
          </div>

          <ul className="space-y-1 text-xs">
            {recommendations.slice(0, 3).map((rec, idx) => (
              <li
                key={idx}
                className="flex items-start gap-1.5"
                style={{ color: severityConfig.color }}
              >
                <span>•</span>
                <span className="leading-relaxed">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  const renderPortsTab = () => {
    const dangerPorts = getAlertsBySeverity(SEVERITY.DANGER);
    const warningPorts = getAlertsBySeverity(SEVERITY.WARNING);
    const cautionPorts = getAlertsBySeverity(SEVERITY.CAUTION);

    const renderPortSection = (ports, severity, title) => {
      if (ports.length === 0) return null;
      const config = getSeverityConfig(severity);

      return (
        <div className="mb-4 last:mb-0">
          <h4
            className="font-semibold text-xs mb-2 flex items-center gap-1.5"
            style={{ color: config.color }}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            {title} ({ports.length})
          </h4>
          <div className="space-y-2">
            {ports.slice(0, 3).map((alert, idx) => (
              <PortAlertCard key={idx} alert={alert} />
            ))}
          </div>
        </div>
      );
    };

    return (
      <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
        {renderPortSection(dangerPorts, SEVERITY.DANGER, "Danger")}
        {renderPortSection(warningPorts, SEVERITY.WARNING, "Warning")}
        {renderPortSection(cautionPorts, SEVERITY.CAUTION, "Caution")}

        {dangerPorts.length === 0 &&
          warningPorts.length === 0 &&
          cautionPorts.length === 0 && (
            <div className="py-6 text-xs text-center text-gray-400">
              All ports clear
            </div>
          )}
      </div>
    );
  };

  const PortAlertCard = ({ alert }) => {
    const config = getSeverityConfig(alert.overallSeverity);
    return (
      <div
        className="p-2 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-[1.02] text-xs backdrop-blur-sm"
        style={{
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
        }}
        onClick={() => {
          if (window.viewWeatherData) {
            window.viewWeatherData(alert.lat, alert.lng, alert.location);
          }
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <span
            className="font-semibold truncate"
            style={{ color: config.color }}
          >
            {alert.location}
          </span>
          <span className="flex-shrink-0 ml-1 text-lg">{config.icon}</span>
        </div>
        <div className="space-y-0.5 opacity-90">
          {alert.weather?.issues.slice(0, 1).map((issue, i) => (
            <div key={i} className="flex items-start gap-1">
              <span>•</span>
              <span style={{ color: config.color }} className="truncate">
                {issue.message}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed top-48 right-28 z-[1000] w-80 backdrop-blur-xl rounded-2xl border-2 border-[#373737] shadow-xl transition-all duration-300 bg-[#1e1e1e]">
      {/* Collapsed State */}
      {!isExpanded ? (
        <div
          className="cursor-pointer bg-[#1e1e1e] rounded-2xl"
          onClick={() => setIsExpanded(true)}
        >
          {renderCompactHeader()}
          {renderQuickStats()}
        </div>
      ) : (
        /* Expanded State */
        <div className="max-h-[70vh] flex flex-col">
          {/* Header */}
          {renderExpandedHeader()}

          {/* Content */}
          <div className="flex-1 p-3 overflow-y-auto">
            {error ? (
              <div
                className={`p-3 text-xs text-center text-red-400 border rounded ${STYLES.border.danger} bg-red-500/10 backdrop-blur-sm`}
              >
                {error}
              </div>
            ) : (
              <>
                {/* Tabs */}
                <div
                  className={`flex gap-1 p-1 mb-4 rounded-lg ${STYLES.bg.secondary} backdrop-blur-sm`}
                >
                  {[
                    { id: "overview", label: "Overview", icon: MapPin },
                    { id: "fishing", label: "Fishing", icon: Anchor },
                    { id: "commercial", label: "Commercial", icon: Ship },
                    { id: "ports", label: "Ports", icon: AlertTriangle },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = selectedTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setSelectedTab(tab.id)}
                        className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-all duration-200 flex-1 justify-center ${
                          isActive
                            ? "bg-blue-500 text-white shadow"
                            : "text-gray-400 hover:bg-white/10 hover:text-white"
                        }`}
                        title={tab.label}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </button>
                    );
                  })}
                </div>

                {/* Tab Content */}
                <div className="min-h-[200px]">
                  {selectedTab === "overview" && renderOverviewTab()}
                  {selectedTab === "fishing" &&
                    renderRecommendationsTab("fishing")}
                  {selectedTab === "commercial" &&
                    renderRecommendationsTab("commercial")}
                  {selectedTab === "ports" && renderPortsTab()}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
}

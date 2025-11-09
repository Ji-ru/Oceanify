import { useState } from 'react';
import { ChevronDown, ChevronUp, RefreshCw, MapPin, Ship, Anchor, AlertTriangle, Clock, X } from 'lucide-react';
import { useWeatherAlerts } from '../../hooks/useWeatherAlerts';
import { getSeverityConfig, SEVERITY } from '../../services/weatherAlertService';

export default function WeatherNotificationPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');

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
  const overallSeverity = userLocationAlert?.overallSeverity || 
    (alertSummary?.danger > 0 ? SEVERITY.DANGER :
     alertSummary?.warning > 0 ? SEVERITY.WARNING :
     alertSummary?.caution > 0 ? SEVERITY.CAUTION :
     SEVERITY.SAFE);

  const severityConfig = getSeverityConfig(overallSeverity);

  const formatLastUpdate = () => {
    if (!lastUpdate) return 'Never';
    const minutes = Math.floor((new Date() - lastUpdate) / 60000);
    if (minutes < 1) return 'Now';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  const renderCompactHeader = () => (
    <div className="flex items-center justify-between p-3">
      <div className="flex items-center gap-2">
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
          style={{ 
            backgroundColor: severityConfig.bgColor,
            color: severityConfig.color,
            border: `2px solid ${severityConfig.borderColor}`
          }}
        >
          {severityConfig.icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white text-sm">Maritime Alert</span>
            <span 
              className="px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ 
                backgroundColor: severityConfig.color,
                color: 'white'
              }}
            >
              {severityConfig.label}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{loading ? 'Updating...' : formatLastUpdate()}</span>
            {alertSummary && (
              <span className="ml-1">• {alertSummary.total} locs</span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            refreshAlerts();
          }}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          disabled={loading}
        >
          <RefreshCw className={`w-3.5 h-3.5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </div>
    </div>
  );

  const renderQuickStats = () => (
    <div className="flex gap-1 px-3 pb-3">
      {alertSummary?.danger > 0 && (
        <div className="flex items-center gap-1 text-xs bg-red-500/20 px-2 py-1 rounded">
          <span className="text-red-400 font-semibold">{alertSummary.danger}</span>
          <span className="text-red-300">Danger</span>
        </div>
      )}
      {alertSummary?.warning > 0 && (
        <div className="flex items-center gap-1 text-xs bg-orange-500/20 px-2 py-1 rounded">
          <span className="text-orange-400 font-semibold">{alertSummary.warning}</span>
          <span className="text-orange-300">Warning</span>
        </div>
      )}
      {alertSummary?.caution > 0 && (
        <div className="flex items-center gap-1 text-xs bg-yellow-500/20 px-2 py-1 rounded">
          <span className="text-yellow-400 font-semibold">{alertSummary.caution}</span>
          <span className="text-yellow-300">Caution</span>
        </div>
      )}
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
              className="flex items-start gap-1.5 p-2 rounded text-xs"
              style={{ 
                backgroundColor: issueConfig.bgColor,
                borderLeft: `2px solid ${issueConfig.color}`
              }}
            >
              <span className="text-xs mt-0.5 flex-shrink-0">{issueConfig.icon}</span>
              <span className="leading-relaxed" style={{ color: issueConfig.color }}>
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
        <div className="p-3 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-blue-400" />
            <h3 className="font-semibold text-white text-sm">Your Location</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="text-gray-400">Weather</div>
              <div className="font-medium text-white truncate">{userLocationAlert.weather?.weatherDescription}</div>
            </div>
            <div>
              <div className="text-gray-400">Temp</div>
              <div className="font-medium text-white">{userLocationAlert.weather?.temperature?.toFixed(0)}°C</div>
            </div>
            {userLocationAlert.waves && (
              <>
                <div>
                  <div className="text-gray-400">Waves</div>
                  <div className="font-medium text-white">{userLocationAlert.waves.waveHeight?.toFixed(1)}m</div>
                </div>
                <div>
                  <div className="text-gray-400">Swell</div>
                  <div className="font-medium text-white">{userLocationAlert.waves.swellHeight?.toFixed(1)}m</div>
                </div>
              </>
            )}
          </div>

          {renderIssues([
            ...(userLocationAlert.weather?.issues || []),
            ...(userLocationAlert.waves?.issues || [])
          ])}
        </div>
      )}

      {/* Quick Stats Grid */}
      {alertSummary && (
        <div className="grid grid-cols-4 gap-2">
          <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-center">
            <div className="text-lg font-bold text-red-400">{alertSummary.danger}</div>
            <div className="text-xs text-red-300">Danger</div>
          </div>
          <div className="p-2 bg-orange-500/10 border border-orange-500/30 rounded text-center">
            <div className="text-lg font-bold text-orange-400">{alertSummary.warning}</div>
            <div className="text-xs text-orange-300">Warning</div>
          </div>
          <div className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-center">
            <div className="text-lg font-bold text-yellow-400">{alertSummary.caution}</div>
            <div className="text-xs text-yellow-300">Caution</div>
          </div>
          <div className="p-2 bg-green-500/10 border border-green-500/30 rounded text-center">
            <div className="text-lg font-bold text-green-400">{alertSummary.safe}</div>
            <div className="text-xs text-green-300">Safe</div>
          </div>
        </div>
      )}
    </div>
  );

  const renderRecommendationsTab = (vesselType) => {
    const alert = userLocationAlert;
    if (!alert) return <div className="text-gray-400 text-xs text-center py-6">No location data</div>;

    const recommendations = alert.recommendations[vesselType];
    const Icon = vesselType === 'fishing' ? Anchor : Ship;

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <Icon className="w-4 h-4 text-blue-400" />
          <h3 className="font-semibold text-white text-sm capitalize">{vesselType} Vessels</h3>
        </div>

        {/* Severity Card */}
        <div className="p-3 rounded-lg border" style={{
          backgroundColor: severityConfig.bgColor,
          borderColor: severityConfig.borderColor,
        }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{severityConfig.icon}</span>
            <span className="font-bold text-sm" style={{ color: severityConfig.color }}>
              {severityConfig.label}
            </span>
          </div>
          
          <ul className="space-y-1 text-xs">
            {recommendations.slice(0, 3).map((rec, idx) => (
              <li key={idx} className="flex items-start gap-1.5" style={{ color: severityConfig.color }}>
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

    const renderPortSection = (ports, severity, title) => {
      if (ports.length === 0) return null;
      const config = getSeverityConfig(severity);
      
      return (
        <div className="mb-4 last:mb-0">
          <h4 className="font-semibold text-xs mb-2 flex items-center gap-1.5" style={{ color: config.color }}>
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
        {renderPortSection(dangerPorts, SEVERITY.DANGER, 'Danger')}
        {renderPortSection(warningPorts, SEVERITY.WARNING, 'Warning')}
        {renderPortSection(warningPorts, SEVERITY.CAUTION, 'Caution')}

        {dangerPorts.length === 0 && warningPorts.length === 0 && (
          <div className="text-center py-6 text-gray-400 text-xs">
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
        className="p-2 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] text-xs"
        style={{ 
          backgroundColor: config.bgColor,
          borderColor: config.borderColor
        }}
        onClick={() => {
          if (window.viewWeatherData) {
            window.viewWeatherData(alert.lat, alert.lng, alert.location);
          }
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold truncate" style={{ color: config.color }}>
            {alert.location}
          </span>
          <span className="text-lg flex-shrink-0 ml-1">{config.icon}</span>
        </div>
        <div className="space-y-0.5 opacity-90">
          {alert.weather?.issues.slice(0, 1).map((issue, i) => (
            <div key={i} className="flex items-start gap-1">
              <span>•</span>
              <span style={{ color: config.color }} className="truncate">{issue.message}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div 
      className="fixed top-4 left-4 z-[1000] w-80 backdrop-blur-xl rounded-xl border shadow-xl transition-all duration-300"
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: severityConfig.borderColor,
      }}
    >
      {/* Collapsed State */}
      {!isExpanded ? (
        <div 
          className="cursor-pointer"
          style={{ 
            background: `linear-gradient(135deg, ${severityConfig.color}15, ${severityConfig.color}05)`
          }}
          onClick={() => setIsExpanded(true)}
        >
          {renderCompactHeader()}
          {renderQuickStats()}
        </div>
      ) : (
        /* Expanded State */
        <div className="max-h-[70vh] flex flex-col">
          {/* Header */}
          <div 
            className="p-3 border-b border-white/10 cursor-pointer flex-shrink-0"
            style={{ 
              background: `linear-gradient(135deg, ${severityConfig.color}15, ${severityConfig.color}05)`
            }}
            onClick={() => setIsExpanded(false)}
          >
            {renderCompactHeader()}
          </div>

          {/* Content */}
          <div className="p-3 overflow-y-auto flex-1">
            {error ? (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-xs text-center">
                {error}
              </div>
            ) : (
              <>
                {/* Tabs */}
                <div className="flex gap-1 mb-4 p-1 bg-white/5 rounded-lg">
                  {[
                    { id: 'overview', label: 'Overview', icon: MapPin },
                    { id: 'fishing', label: 'Fishing', icon: Anchor },
                    { id: 'commercial', label: 'Commercial', icon: Ship },
                    { id: 'ports', label: 'Ports', icon: AlertTriangle },
                  ].map(tab => {
                    const Icon = tab.icon;
                    const isActive = selectedTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setSelectedTab(tab.id)}
                        className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-all flex-1 justify-center ${
                          isActive
                            ? 'bg-blue-500 text-white shadow'
                            : 'text-gray-400 hover:bg-white/10 hover:text-white'
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
                  {selectedTab === 'overview' && renderOverviewTab()}
                  {selectedTab === 'fishing' && renderRecommendationsTab('fishing')}
                  {selectedTab === 'commercial' && renderRecommendationsTab('commercial')}
                  {selectedTab === 'ports' && renderPortsTab()}
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
      `}</style>
    </div>
  );
}
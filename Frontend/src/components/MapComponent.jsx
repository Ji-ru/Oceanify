import { useEffect } from "react";

export default function WindyMap() {
  useEffect(() => {
    // Load Leaflet first
    const leafletScript = document.createElement("script");
    leafletScript.src = "https://unpkg.com/leaflet@1.4.0/dist/leaflet.js";
    leafletScript.async = true;
    document.body.appendChild(leafletScript);

    leafletScript.onload = () => {
      // Then load Windy API
      const windyScript = document.createElement("script");
      windyScript.src = "https://api.windy.com/assets/map-forecast/libBoot.js";
      windyScript.async = true;
      document.body.appendChild(windyScript);

      windyScript.onload = () => {
        if (window.windyInit) {
          window.windyInit(
            {
              key: "ZjlNmMtUzQhafUCxvgB2tlRZntnCZnDP", // ⚠️ replace with your API key
              lat: 20,
              lon: 0,
              zoom: 3,
              overlay: "wind", // default overlay
            },
            (windyAPI) => {
              const { map, overlays } = windyAPI;

              // Enable Wind overlay by default
              overlays.wind.setEnabled(true);
              overlays.temp.setEnabled(true);
              overlays.rain.setEnabled(false);
              overlays.clouds.setEnabled(false);
              // Example: log overlay change
              map.on("overlay:change", (e) => {
                console.log("Overlay changed:", e.overlay);
              });
            }
          );
        }
      };
    };

    // Cleanup on unmount
    return () => {
      document.body.removeChild(leafletScript);
      const windyScript = document.querySelector(
        'script[src="https://api.windy.com/assets/map-forecast/libBoot.js"]'
      );
      if (windyScript) document.body.removeChild(windyScript);
    };
  }, []);

  return <div id="windy" style={{ width: "100%", height: "100vh" }}/>;
}

import { useMemo } from "react";

  /**
   * Renders a formatted coordinates for the user's location
   * Sets a proper cardinal direction and format coordinates into a readable string 
   * @param lat - lattitude
   * @param lng - longitude
   */
    const formatCoordinates = (lat, lng) => {
    if (lat == null || lng == null) return "Unknown";

    const latDir = lat >= 0 ? "N" : "S";
    const lngDir = lng >= 0 ? "E" : "W";

    const absLat = Math.abs(lat).toFixed(2);
    const absLng = Math.abs(lng).toFixed(2);

    return `${absLat}° ${latDir}, ${absLng}° ${lngDir}`;
  };

  /**
   * Retrieve users location and pass it to the userLocation function to format the text of coordinates
   */
  export const useFormattedCoordinates = (userLocation) => {
      const formattedCoords = useMemo(() => {
        if (!userLocation) return "Unknown";
        return formatCoordinates(userLocation.lat, userLocation.lng);
      }, [userLocation]);
      
      return {
        formattedCoords
      };
  };


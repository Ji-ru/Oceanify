// AdminEmergencyMarkers.jsx
import { useEffect, useState } from "react";
import supabase from "../../supabaseClient";
import { useAuth } from "../../contexts/AuthContext";

export default function AdminEmergencyMarkers({ mapRef }) {
  const { userRole, loading: authLoading } = useAuth();
  const [rescueRequests, setRescueRequests] = useState([]);

  useEffect(() => {
    if (authLoading) return; // wait until auth is loaded
    if (userRole !== "admin") return; // only admin can see emergency markers
    if (!mapRef?.current) return; // wait until map is initialized

    const L = window.L;
    if (!L) return;

    let markers = [];

    const fetchRescueRequests = async () => {
      try {
        const { data, error } = await supabase
          .from("rescue_requests")
          .select("*")
          .order("timestamp", { ascending: false });

        if (error) throw error;
        if (!data?.length) return;

        setRescueRequests(data);

        // Remove old markers
        markers.forEach((m) => mapRef.current?.removeLayer?.(m));
        markers = [];

        data.forEach((req) => {
          if (!req.latitude || !req.longitude) return;

          const iconHtml = `<div style="
            background: linear-gradient(135deg, #dc2626, #b91c1c);
            color:white;
            border-radius:50%;
            width:48px;
            height:48px;
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:24px;
            font-weight:bold;
            border:4px solid white;
            box-shadow:0 4px 12px rgba(220,38,38,0.5);
            animation: pulse 2s infinite;">🆘</div>`;

          const sosIcon = L.divIcon({
            html: iconHtml,
            iconSize: [48, 48],
            iconAnchor: [24, 24],
          });

          const marker = L.marker([req.latitude, req.longitude], { icon: sosIcon })
            .addTo(mapRef.current)
            .bindPopup(
              `<div class="p-4 bg-gradient-to-br from-red-900/90 to-orange-900/70 rounded-xl border border-red-500/30 backdrop-blur-sm min-w-[200px]">
                <div class="text-white font-bold text-lg mb-2">🆘 EMERGENCY RESCUE</div>
                <div class="text-red-200 text-sm mb-1">Reason: ${req.reason.replace(/_/g, " ").toUpperCase()}</div>
                <div class="text-orange-200 text-xs">${new Date(req.timestamp).toLocaleString()}</div>
                <div class="mt-2 text-xs text-yellow-200">Status: ${req.status.toUpperCase()}</div>
              </div>`
            );

          markers.push(marker);
        });
      } catch (err) {
        console.error("Error fetching rescue requests:", err);
      }
    };

    fetchRescueRequests();

    // Subscribe to real-time changes
    const channel = supabase
      .channel("rescue_requests_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rescue_requests" },
        () => fetchRescueRequests()
      )
      .subscribe();

    return () => {
      // Cleanup
      markers.forEach((m) => mapRef.current?.removeLayer?.(m));
      supabase.removeChannel(channel);
    };
  }, [mapRef, userRole, authLoading]);

  return null;
}

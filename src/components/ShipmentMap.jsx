import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function ShipmentMap({ shipment }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      // Ensure existing map on this DOM node is properly cleaned up
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // If Leaflet ID still exists on container from previous unmount
      if (mapContainerRef.current._leaflet_id) {
        mapContainerRef.current._leaflet_id = null;
      }

      // Initialize map
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([20, 90], 3);

      // Clean Light Ocean Basemap (CartoDB Positron - matches Tracktainer aesthetic)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
        subdomains: 'abcd',
      }).addTo(map);

      // Add clean zoom control to top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
      layerGroupRef.current = layerGroup;

      if (shipment) {
        const pol = shipment.pol || { lat: 36.0671, lng: 120.3826, name: 'Qingdao', code: 'CNTAO' };
        const pod = shipment.pod || { lat: 24.8607, lng: 67.0011, name: 'Karachi', code: 'PKKHI' };
        const current = shipment.currentPosition || { lat: 23.85, lng: 65.8 };
        const routeCoords = shipment.routePath || [
          [pol.lat, pol.lng],
          [22.2, 114.1],
          [1.3, 103.8],
          [6.0, 80.2],
          [current.lat, current.lng],
          [pod.lat, pod.lng]
        ];

        // 1. Draw maritime route line (vibrant blue matching Tracktainer)
        L.polyline(routeCoords, {
          color: '#0284c7',
          weight: 3.5,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round',
          smoothFactor: 1,
        }).addTo(layerGroup);

        // Subtle glow line underneath
        L.polyline(routeCoords, {
          color: '#38bdf8',
          weight: 7,
          opacity: 0.25,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(layerGroup);

        // 2. POL Port Marker (Origin)
        const polIcon = L.divIcon({
          className: 'custom-pol-marker',
          html: `
            <div style="display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -50%); cursor:pointer;">
              <div style="background:#0369a1; color:#fff; font-size:10px; font-weight:700; padding:2px 8px; border-radius:12px; box-shadow:0 2px 6px rgba(0,0,0,0.25); white-space:nowrap; letter-spacing:0.5px;">
                POL
              </div>
              <div style="width:10px; height:10px; background:#0369a1; border:2px solid #fff; border-radius:50%; margin-top:2px; box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        L.marker([pol.lat, pol.lng], { icon: polIcon })
          .bindPopup(`<b>POL: ${pol.name} (${pol.code || ''})</b><br>${pol.country || ''}<br>Departed: ${pol.date || ''}`)
          .addTo(layerGroup);

        // 3. POD Port Marker (Destination)
        const podIcon = L.divIcon({
          className: 'custom-pod-marker',
          html: `
            <div style="display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -50%); cursor:pointer;">
              <div style="background:#0284c7; color:#fff; font-size:10px; font-weight:700; padding:2px 8px; border-radius:12px; box-shadow:0 2px 6px rgba(0,0,0,0.25); white-space:nowrap; letter-spacing:0.5px;">
                POD
              </div>
              <div style="width:10px; height:10px; background:#0284c7; border:2px solid #fff; border-radius:50%; margin-top:2px; box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        L.marker([pod.lat, pod.lng], { icon: podIcon })
          .bindPopup(`<b>POD: ${pod.name} (${pod.code || ''})</b><br>${pod.country || ''}<br>ETA: ${pod.date || ''}`)
          .addTo(layerGroup);

        // 4. Live Vessel Marker (with ripple animation as seen in Tracktainer screenshot!)
        const shipIcon = L.divIcon({
          className: 'custom-ship-marker',
          html: `
            <div style="position:relative; width:44px; height:44px; display:flex; align-items:center; justify-content:center; transform: translate(-50%, -50%); cursor:pointer;">
              <div style="position:absolute; width:40px; height:40px; border-radius:50%; background:rgba(2, 132, 199, 0.25); border:1.5px solid #0284c7; animation:pulse-ring 2s infinite ease-in-out;"></div>
              <div style="position:absolute; width:28px; height:28px; border-radius:50%; background:#0284c7; display:flex; align-items:center; justify-content:center; box-shadow:0 3px 8px rgba(2, 132, 199, 0.4); border:2px solid #ffffff;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
                  <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/>
                  <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/>
                  <path d="M12 10v4"/>
                  <path d="M12 2v3"/>
                </svg>
              </div>
            </div>
          `,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        });

        const vesselMarker = L.marker([current.lat, current.lng], { icon: shipIcon })
          .bindPopup(`
            <div style="font-size:12px; font-family:sans-serif; line-height:1.4;">
              <b style="font-size:13px; color:#0f172a;">${shipment.vesselName || 'Vessel'}</b><br>
              <span style="color:#64748b;">IMO: ${shipment.imo || 'N/A'} | Voyage: ${shipment.voyage || 'N/A'}</span><br>
              <div style="margin-top:6px; padding:4px 6px; background:#f0f9ff; border-radius:4px; color:#0284c7; font-weight:600;">
                Speed: ${current.speedKnots || 14.8} kts | Heading: ${current.heading || 340}°
              </div>
              <div style="margin-top:4px; color:#334155;">${current.statusDescription || 'Underway'}</div>
            </div>
          `)
          .addTo(layerGroup);

        // Fit bounds nicely with padding
        const bounds = L.latLngBounds([
          [pol.lat, pol.lng],
          [pod.lat, pod.lng],
          [current.lat, current.lng],
        ]);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 5 });

        // Open vessel popup
        setTimeout(() => {
          if (mapInstanceRef.current && vesselMarker) {
            vesselMarker.openPopup();
          }
        }, 400);
      }
    } catch (err) {
      console.warn('Leaflet map initialization notice:', err);
    }

    return () => {
      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      } catch (e) {}
    };
  }, [shipment]);

  return (
    <div className="relative w-full h-full min-h-[460px] rounded-xl overflow-hidden shadow-sm border border-[#ece8df] bg-[#eef6fc]">
      <div ref={mapContainerRef} className="w-full h-full min-h-[460px]" />

      {/* Floating map info badge */}
      <div className="absolute top-3 left-3 z-[400] bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-200/80 shadow-sm flex items-center gap-2 text-xs font-medium text-slate-700">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>AIS Satellite Tracking Active</span>
        <span className="text-slate-300">|</span>
        <span className="text-slate-500">Live Ocean Route</span>
      </div>
    </div>
  );
}
